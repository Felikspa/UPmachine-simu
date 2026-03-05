#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Tickable.h"
#include "Entities/MqttMessage.h"
#include "Interface/MqttClientInterface.h"
#include "FastBeeMqttSubsystem.generated.h"

class AActor;
class FJsonObject;

USTRUCT()
struct FFastBeeMachineState
{
	GENERATED_BODY()

	UPROPERTY(Transient)
	TWeakObjectPtr<AActor> TargetActor;

	// 基础运行状态
	UPROPERTY(Transient)
	float Rpm = 0.0f;

	UPROPERTY(Transient)
	bool bRunning = true;

	UPROPERTY(Transient)
	FString LastPayload;

	// 温度数据
	UPROPERTY(Transient)
	float BarrelTemperature = 0.0f;

	UPROPERTY(Transient)
	float MoldTemperature = 0.0f;

	UPROPERTY(Transient)
	float OilTemperature = 0.0f;

	// 压力数据
	UPROPERTY(Transient)
	float InjectionPressure = 0.0f;

	UPROPERTY(Transient)
	float HoldingPressure = 0.0f;

	UPROPERTY(Transient)
	float BackPressure = 0.0f;

	// 位置数据
	UPROPERTY(Transient)
	float ScrewPosition = 0.0f;

	UPROPERTY(Transient)
	float InjectionUnitPosition = 0.0f;

	// 计数数据
	UPROPERTY(Transient)
	int32 ProductionCount = 0;

	UPROPERTY(Transient)
	int32 DefectCount = 0;

	// 状态数据
	UPROPERTY(Transient)
	FString AlarmStatus;

	UPROPERTY(Transient)
	FString WorkMode;
};

UCLASS()
class AIRCITYEXPLORER_API UFastBeeMqttSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	virtual void Tick(float DeltaTime) override;
	virtual TStatId GetStatId() const override;
	virtual bool IsTickable() const override;

	// 双向控制接口 - 蓝图可调用
	UFUNCTION(BlueprintCallable, Category = "FastBee|MQTT")
	void PublishCommand(const FString& DeviceId, const FString& Command, const FString& JsonPayload);

	UFUNCTION(BlueprintCallable, Category = "FastBee|MQTT")
	void StartMachine(const FString& DeviceId);

	UFUNCTION(BlueprintCallable, Category = "FastBee|MQTT")
	void StopMachine(const FString& DeviceId);

	UFUNCTION(BlueprintCallable, Category = "FastBee|MQTT")
	void SetMachineParameter(const FString& DeviceId, const FString& ParamName, float Value);

	// 获取机器状态 - 蓝图可调用
	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "FastBee|MQTT")
	bool GetMachineState(const FString& DeviceId, float& OutRpm, bool& OutRunning, float& OutBarrelTemp, float& OutMoldTemp, float& OutInjectionPressure);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "FastBee|MQTT")
	TArray<FString> GetConnectedDevices() const;

private:
	void StartConnection();
	void SubscribeConfiguredTopics();
	FString BuildClientId() const;
	FString ResolveDeviceId(const FString& Topic, const TSharedPtr<FJsonObject>& Json) const;
	void UpdateMachineState(const FString& DeviceId, const FString& Payload, const TSharedPtr<FJsonObject>& Json);
	AActor* ResolveMachineActor(const FString& DeviceId) const;
	bool TryDispatchPayloadToBlueprint(AActor* TargetActor, const FString& Payload) const;
	void RotateMachineActors(float DeltaSeconds);

	static bool ParseBoolOrNumber(const TSharedPtr<FJsonObject>& Json, const TCHAR* FieldName, bool& OutValue);
	static bool ParseNumber(const TSharedPtr<FJsonObject>& Json, const TCHAR* FieldName, double& OutValue);

	UFUNCTION()
	void HandleConnected();

	UFUNCTION()
	void HandleMessage(FMqttMessage Message);

	UFUNCTION()
	void HandleError(int32 Code, FString Message);

private:
	UPROPERTY(Transient)
	TScriptInterface<IMqttClientInterface> MqttClient;

	UPROPERTY(Transient)
	TMap<FString, FFastBeeMachineState> MachineStates;

	bool bInitialized = false;
};
