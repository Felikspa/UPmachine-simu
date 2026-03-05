#include "FastBeeMqttSubsystem.h"

#include "FastBeeMqttSettings.h"
#include "MqttUtilitiesBPL.h"
#include "Entities/MqttClientConfig.h"
#include "Entities/MqttConnectionData.h"

#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "EngineUtils.h"
#include "GameFramework/Actor.h"
#include "Misc/Guid.h"
#include "UObject/UnrealType.h"
#include "MachinePartController.h"

void UFastBeeMqttSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	if (Settings == nullptr || !Settings->bEnableFastBeeMqtt)
	{
		UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: disabled by config."));
		return;
	}

	bInitialized = true;
	StartConnection();
}

void UFastBeeMqttSubsystem::Deinitialize()
{
	if (MqttClient.GetObject() != nullptr)
	{
		FOnDisconnectDelegate OnDisconnectDelegate;
		MqttClient->Disconnect(OnDisconnectDelegate);
		MqttClient.SetInterface(nullptr);
		MqttClient.SetObject(nullptr);
	}

	MachineStates.Empty();
	bInitialized = false;

	Super::Deinitialize();
}

void UFastBeeMqttSubsystem::Tick(float DeltaTime)
{
	if (!bInitialized)
	{
		return;
	}

	RotateMachineActors(DeltaTime);
}

TStatId UFastBeeMqttSubsystem::GetStatId() const
{
	RETURN_QUICK_DECLARE_CYCLE_STAT(UFastBeeMqttSubsystem, STATGROUP_Tickables);
}

bool UFastBeeMqttSubsystem::IsTickable() const
{
	return bInitialized;
}

void UFastBeeMqttSubsystem::StartConnection()
{
	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	if (Settings == nullptr)
	{
		return;
	}

	if (Settings->BrokerHost.IsEmpty() || Settings->BrokerPort <= 0)
	{
		UE_LOG(LogTemp, Error, TEXT("FastBee MQTT: BrokerHost or BrokerPort is invalid."));
		return;
	}

	FMqttClientConfig ClientConfig;
	ClientConfig.HostUrl = Settings->BrokerHost;
	ClientConfig.Port = Settings->BrokerPort;
	ClientConfig.ClientId = Settings->ClientId.IsEmpty() ? BuildClientId() : Settings->ClientId;
	ClientConfig.EventLoopDeltaMs = Settings->EventLoopDeltaMs;

	MqttClient = UMqttUtilitiesBPL::CreateMqttClient(ClientConfig);
	if (MqttClient.GetObject() == nullptr)
	{
		UE_LOG(LogTemp, Error, TEXT("FastBee MQTT: failed to create mqtt client."));
		return;
	}

	FOnMessageDelegate OnMessageDelegate;
	OnMessageDelegate.BindDynamic(this, &UFastBeeMqttSubsystem::HandleMessage);
	MqttClient->SetOnMessageHandler(OnMessageDelegate);

	FOnMqttErrorDelegate OnErrorDelegate;
	OnErrorDelegate.BindDynamic(this, &UFastBeeMqttSubsystem::HandleError);
	MqttClient->SetOnErrorHandler(OnErrorDelegate);

	FMqttConnectionData ConnectionData;
	ConnectionData.Login = Settings->Username;
	ConnectionData.Password = Settings->Password;

	FOnConnectDelegate OnConnectDelegate;
	OnConnectDelegate.BindDynamic(this, &UFastBeeMqttSubsystem::HandleConnected);
	MqttClient->Connect(ConnectionData, OnConnectDelegate);

	UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: connecting to %s:%d"), *ClientConfig.HostUrl, ClientConfig.Port);
}

void UFastBeeMqttSubsystem::SubscribeConfiguredTopics()
{
	if (MqttClient.GetObject() == nullptr)
	{
		return;
	}

	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	if (Settings == nullptr)
	{
		return;
	}

	const int32 Qos = FMath::Clamp(Settings->TopicQos, 0, 2);

	if (Settings->SubscribeTopics.Num() == 0)
	{
		MqttClient->Subscribe(TEXT("fastbee/#"), Qos);
		UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: subscribed to fastbee/# (default)."));
		return;
	}

	for (const FString& Topic : Settings->SubscribeTopics)
	{
		if (!Topic.IsEmpty())
		{
			MqttClient->Subscribe(Topic, Qos);
			UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: subscribed to %s"), *Topic);
		}
	}
}

FString UFastBeeMqttSubsystem::BuildClientId() const
{
	return FString::Printf(TEXT("AirCityExplorer-%s"), *FGuid::NewGuid().ToString(EGuidFormats::Digits).Left(10));
}

FString UFastBeeMqttSubsystem::ResolveDeviceId(const FString& Topic, const TSharedPtr<FJsonObject>& Json) const
{
	FString DeviceId;
	if (Json.IsValid())
	{
		if (Json->TryGetStringField(TEXT("deviceId"), DeviceId) && !DeviceId.IsEmpty())
		{
			return DeviceId;
		}

		if (Json->TryGetStringField(TEXT("machineId"), DeviceId) && !DeviceId.IsEmpty())
		{
			return DeviceId;
		}

		if (Json->TryGetStringField(TEXT("id"), DeviceId) && !DeviceId.IsEmpty())
		{
			return DeviceId;
		}
	}

	if (!Topic.IsEmpty())
	{
		TArray<FString> Segments;
		Topic.ParseIntoArray(Segments, TEXT("/"), true);
		if (Segments.Num() > 0)
		{
			const FString& Last = Segments.Last();
			if ((Last.Equals(TEXT("telemetry"), ESearchCase::IgnoreCase) ||
				Last.Equals(TEXT("state"), ESearchCase::IgnoreCase) ||
				Last.Equals(TEXT("status"), ESearchCase::IgnoreCase) ||
				Last.Equals(TEXT("data"), ESearchCase::IgnoreCase)) &&
				Segments.Num() > 1)
			{
				return Segments[Segments.Num() - 2];
			}

			return Last;
		}
	}

	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	return Settings != nullptr ? Settings->DefaultDeviceId : TEXT("machine01");
}

void UFastBeeMqttSubsystem::UpdateMachineState(const FString& DeviceId, const FString& Payload, const TSharedPtr<FJsonObject>& Json)
{
	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	const FString FinalDeviceId = DeviceId.IsEmpty() ? (Settings ? Settings->DefaultDeviceId : TEXT("machine01")) : DeviceId;

	FFastBeeMachineState& State = MachineStates.FindOrAdd(FinalDeviceId);
	State.LastPayload = Payload;

	if (Json.IsValid())
	{
		// 基础运行状态
		double RpmValue = 0.0;
		if (ParseNumber(Json, TEXT("rpm"), RpmValue) ||
			ParseNumber(Json, TEXT("speed"), RpmValue) ||
			ParseNumber(Json, TEXT("value"), RpmValue))
		{
			State.Rpm = static_cast<float>(RpmValue);
		}

		bool bRunningValue = true;
		if (ParseBoolOrNumber(Json, TEXT("running"), bRunningValue) ||
			ParseBoolOrNumber(Json, TEXT("run"), bRunningValue))
		{
			State.bRunning = bRunningValue;
		}
		else
		{
			FString StateText;
			if (Json->TryGetStringField(TEXT("state"), StateText))
			{
				State.bRunning = !StateText.Equals(TEXT("stop"), ESearchCase::IgnoreCase) &&
					!StateText.Equals(TEXT("stopped"), ESearchCase::IgnoreCase) &&
					!StateText.Equals(TEXT("off"), ESearchCase::IgnoreCase);
			}
		}

		// 温度数据
		double TempValue = 0.0;
		if (ParseNumber(Json, TEXT("barrel_temperature"), TempValue))
		{
			State.BarrelTemperature = static_cast<float>(TempValue);
		}
		if (ParseNumber(Json, TEXT("mold_temperature"), TempValue))
		{
			State.MoldTemperature = static_cast<float>(TempValue);
		}
		if (ParseNumber(Json, TEXT("oil_temperature"), TempValue))
		{
			State.OilTemperature = static_cast<float>(TempValue);
		}

		// 压力数据
		double PressureValue = 0.0;
		if (ParseNumber(Json, TEXT("injection_pressure"), PressureValue))
		{
			State.InjectionPressure = static_cast<float>(PressureValue);
		}
		if (ParseNumber(Json, TEXT("holding_pressure"), PressureValue))
		{
			State.HoldingPressure = static_cast<float>(PressureValue);
		}
		if (ParseNumber(Json, TEXT("back_pressure"), PressureValue))
		{
			State.BackPressure = static_cast<float>(PressureValue);
		}

		// 位置数据
		double PositionValue = 0.0;
		if (ParseNumber(Json, TEXT("screw_position"), PositionValue))
		{
			State.ScrewPosition = static_cast<float>(PositionValue);
		}
		if (ParseNumber(Json, TEXT("injection_unit_position"), PositionValue))
		{
			State.InjectionUnitPosition = static_cast<float>(PositionValue);
		}

		// 计数数据
		double CountValue = 0.0;
		if (ParseNumber(Json, TEXT("production_count"), CountValue))
		{
			State.ProductionCount = static_cast<int32>(CountValue);
		}
		if (ParseNumber(Json, TEXT("defect_count"), CountValue))
		{
			State.DefectCount = static_cast<int32>(CountValue);
		}

		// 状态数据
		Json->TryGetStringField(TEXT("alarm_status"), State.AlarmStatus);
		Json->TryGetStringField(TEXT("work_mode"), State.WorkMode);
	}
	else
	{
		State.Rpm = FCString::Atof(*Payload);
		State.bRunning = !FMath::IsNearlyZero(State.Rpm);
	}

	if (!State.TargetActor.IsValid())
	{
		State.TargetActor = ResolveMachineActor(FinalDeviceId);
	}

	if (State.TargetActor.IsValid())
	{
		TryDispatchPayloadToBlueprint(State.TargetActor.Get(), Payload);

		// 更新部件级控制
		UMachinePartController* PartController = State.TargetActor->FindComponentByClass<UMachinePartController>();
		if (PartController != nullptr)
		{
			PartController->UpdateMachineState(
				State.ScrewPosition,
				State.InjectionUnitPosition,
				State.BarrelTemperature,
				State.MoldTemperature
			);

			// 更新螺杆旋转
			PartController->UpdateScrewRotation(State.Rpm);
		}
	}
}

AActor* UFastBeeMqttSubsystem::ResolveMachineActor(const FString& DeviceId) const
{
	UWorld* World = GetWorld();
	if (World == nullptr)
	{
		return nullptr;
	}

	if (!DeviceId.IsEmpty())
	{
		const FName DeviceTag(*DeviceId);

		for (TActorIterator<AActor> It(World); It; ++It)
		{
			AActor* Actor = *It;
			if (Actor == nullptr || Actor->IsPendingKill())
			{
				continue;
			}

			if (Actor->ActorHasTag(DeviceTag))
			{
				return Actor;
			}
		}

		for (TActorIterator<AActor> It(World); It; ++It)
		{
			AActor* Actor = *It;
			if (Actor == nullptr || Actor->IsPendingKill())
			{
				continue;
			}

			if (Actor->GetName().Contains(DeviceId))
			{
				return Actor;
			}
		}
	}

	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	const FString ClassKeyword = (Settings == nullptr || Settings->MachineClassKeyword.IsEmpty()) ? TEXT("BP_Machine") : Settings->MachineClassKeyword;

	for (TActorIterator<AActor> It(World); It; ++It)
	{
		AActor* Actor = *It;
		if (Actor == nullptr || Actor->IsPendingKill())
		{
			continue;
		}

		const UClass* ActorClass = Actor->GetClass();
		if (ActorClass != nullptr && ActorClass->GetName().Contains(ClassKeyword))
		{
			return Actor;
		}
	}

	return nullptr;
}

bool UFastBeeMqttSubsystem::TryDispatchPayloadToBlueprint(AActor* TargetActor, const FString& Payload) const
{
	if (TargetActor == nullptr)
	{
		return false;
	}

	static const FName HookNames[] = {
		TEXT("ApplyFastBeePayload"),
		TEXT("OnFastBeePayload"),
		TEXT("ApplyMqttPayload"),
		TEXT("OnMqttPayload")
	};

	for (const FName& HookName : HookNames)
	{
		UFunction* Function = TargetActor->FindFunction(HookName);
		if (Function == nullptr || Function->NumParms != 1)
		{
			continue;
		}

		FProperty* Param = Function->PropertyLink;
		if (Param == nullptr || CastField<FStrProperty>(Param) == nullptr)
		{
			continue;
		}

		struct FMqttStringParam
		{
			FString Value;
		};

		FMqttStringParam Params;
		Params.Value = Payload;
		TargetActor->ProcessEvent(Function, &Params);
		return true;
	}

	return false;
}

void UFastBeeMqttSubsystem::RotateMachineActors(float DeltaSeconds)
{
	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	if (Settings == nullptr || !Settings->bRotateActorFromRpm)
	{
		return;
	}

	for (TPair<FString, FFastBeeMachineState>& Pair : MachineStates)
	{
		FFastBeeMachineState& State = Pair.Value;

		if (!State.TargetActor.IsValid())
		{
			State.TargetActor = ResolveMachineActor(Pair.Key);
		}

		AActor* TargetActor = State.TargetActor.Get();
		if (TargetActor == nullptr || !State.bRunning || FMath::IsNearlyZero(State.Rpm))
		{
			continue;
		}

		const float DegreesPerSecond = State.Rpm * 6.0f;
		FRotator CurrentRotation = TargetActor->GetActorRotation();
		CurrentRotation.Yaw += DegreesPerSecond * DeltaSeconds;
		TargetActor->SetActorRotation(CurrentRotation);
	}
}

bool UFastBeeMqttSubsystem::ParseBoolOrNumber(const TSharedPtr<FJsonObject>& Json, const TCHAR* FieldName, bool& OutValue)
{
	if (!Json.IsValid())
	{
		return false;
	}

	bool BoolValue = false;
	if (Json->TryGetBoolField(FieldName, BoolValue))
	{
		OutValue = BoolValue;
		return true;
	}

	double NumberValue = 0.0;
	if (Json->TryGetNumberField(FieldName, NumberValue))
	{
		OutValue = !FMath::IsNearlyZero(NumberValue);
		return true;
	}

	FString StringValue;
	if (Json->TryGetStringField(FieldName, StringValue))
	{
		OutValue = StringValue.Equals(TEXT("true"), ESearchCase::IgnoreCase) ||
			StringValue.Equals(TEXT("on"), ESearchCase::IgnoreCase) ||
			StringValue.Equals(TEXT("run"), ESearchCase::IgnoreCase) ||
			StringValue == TEXT("1");
		return true;
	}

	return false;
}

bool UFastBeeMqttSubsystem::ParseNumber(const TSharedPtr<FJsonObject>& Json, const TCHAR* FieldName, double& OutValue)
{
	if (!Json.IsValid())
	{
		return false;
	}

	if (Json->TryGetNumberField(FieldName, OutValue))
	{
		return true;
	}

	FString StringValue;
	if (Json->TryGetStringField(FieldName, StringValue))
	{
		OutValue = FCString::Atod(*StringValue);
		return true;
	}

	return false;
}

void UFastBeeMqttSubsystem::HandleConnected()
{
	UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: connected."));
	SubscribeConfiguredTopics();
}

void UFastBeeMqttSubsystem::HandleMessage(FMqttMessage Message)
{
	if (Message.Message.IsEmpty() && Message.MessageBuffer.Num() == 0)
	{
		return;
	}

	FString Payload = Message.Message;
	if (Payload.IsEmpty() && Message.MessageBuffer.Num() > 0)
	{
		TArray<uint8> Buffer = Message.MessageBuffer;
		Buffer.Add(0);
		Payload = UTF8_TO_TCHAR(reinterpret_cast<const char*>(Buffer.GetData()));
	}

	TSharedPtr<FJsonObject> JsonObject;
	bool bValidJson = false;
	if (!Payload.IsEmpty())
	{
		TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Payload);
		bValidJson = FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid();
	}

	const TSharedPtr<FJsonObject> SafeJson = bValidJson ? JsonObject : TSharedPtr<FJsonObject>();
	const FString DeviceId = ResolveDeviceId(Message.Topic, SafeJson);
	UpdateMachineState(DeviceId, Payload, SafeJson);
}

void UFastBeeMqttSubsystem::HandleError(int32 Code, FString Message)
{
	UE_LOG(LogTemp, Error, TEXT("FastBee MQTT Error [%d]: %s"), Code, *Message);
}

// ==================== 双向控制功能实现 ====================

void UFastBeeMqttSubsystem::PublishCommand(const FString& DeviceId, const FString& Command, const FString& JsonPayload)
{
	if (MqttClient.GetObject() == nullptr)
	{
		UE_LOG(LogTemp, Warning, TEXT("FastBee MQTT: cannot publish, client not connected."));
		return;
	}

	if (DeviceId.IsEmpty() || Command.IsEmpty())
	{
		UE_LOG(LogTemp, Warning, TEXT("FastBee MQTT: DeviceId or Command is empty."));
		return;
	}

	const UFastBeeMqttSettings* Settings = GetDefault<UFastBeeMqttSettings>();
	const FString Topic = FString::Printf(TEXT("fastbee/%s/command"), *DeviceId);

	FString Payload = JsonPayload;
	if (Payload.IsEmpty())
	{
		TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
		JsonObject->SetStringField(TEXT("command"), Command);
		JsonObject->SetNumberField(TEXT("timestamp"), FDateTime::UtcNow().ToUnixTimestamp());

		FString OutputString;
		TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
		FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
		Payload = OutputString;
	}

	FMqttMessage Message;
	Message.Topic = Topic;
	Message.Message = Payload;
	Message.Qos = Settings ? Settings->TopicQos : 0;
	Message.Retain = false;

	MqttClient->Publish(Message);
	UE_LOG(LogTemp, Log, TEXT("FastBee MQTT: published to %s: %s"), *Topic, *Payload);
}

void UFastBeeMqttSubsystem::StartMachine(const FString& DeviceId)
{
	TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
	JsonObject->SetStringField(TEXT("command"), TEXT("start"));
	JsonObject->SetNumberField(TEXT("timestamp"), FDateTime::UtcNow().ToUnixTimestamp());

	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

	PublishCommand(DeviceId, TEXT("start"), OutputString);
}

void UFastBeeMqttSubsystem::StopMachine(const FString& DeviceId)
{
	TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
	JsonObject->SetStringField(TEXT("command"), TEXT("stop"));
	JsonObject->SetNumberField(TEXT("timestamp"), FDateTime::UtcNow().ToUnixTimestamp());

	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

	PublishCommand(DeviceId, TEXT("stop"), OutputString);
}

void UFastBeeMqttSubsystem::SetMachineParameter(const FString& DeviceId, const FString& ParamName, float Value)
{
	TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
	JsonObject->SetStringField(TEXT("command"), TEXT("set_param"));
	JsonObject->SetNumberField(TEXT("timestamp"), FDateTime::UtcNow().ToUnixTimestamp());

	TSharedPtr<FJsonObject> ParamsObject = MakeShareable(new FJsonObject);
	ParamsObject->SetNumberField(ParamName, Value);
	JsonObject->SetObjectField(TEXT("parameters"), ParamsObject);

	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

	PublishCommand(DeviceId, TEXT("set_param"), OutputString);
}

bool UFastBeeMqttSubsystem::GetMachineState(const FString& DeviceId, float& OutRpm, bool& OutRunning,
	float& OutBarrelTemp, float& OutMoldTemp, float& OutInjectionPressure)
{
	const FFastBeeMachineState* State = MachineStates.Find(DeviceId);
	if (State == nullptr)
	{
		return false;
	}

	OutRpm = State->Rpm;
	OutRunning = State->bRunning;
	OutBarrelTemp = State->BarrelTemperature;
	OutMoldTemp = State->MoldTemperature;
	OutInjectionPressure = State->InjectionPressure;

	return true;
}

TArray<FString> UFastBeeMqttSubsystem::GetConnectedDevices() const
{
	TArray<FString> DeviceIds;
	MachineStates.GetKeys(DeviceIds);
	return DeviceIds;
}
