#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "FastBeeMqttSettings.generated.h"

UCLASS(config = Game, defaultconfig)
class AIRCITYEXPLORER_API UFastBeeMqttSettings : public UObject
{
	GENERATED_BODY()

public:
	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	bool bEnableFastBeeMqtt = true;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	FString BrokerHost = TEXT("127.0.0.1");

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	int32 BrokerPort = 1883;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	FString ClientId = TEXT("AirCityExplorer");

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	FString Username;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	FString Password;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	int32 EventLoopDeltaMs = 20;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	int32 TopicQos = 0;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|MQTT")
	TArray<FString> SubscribeTopics;

	UPROPERTY(config, EditAnywhere, Category = "FastBee|Runtime")
	FString DefaultDeviceId = TEXT("machine01");

	UPROPERTY(config, EditAnywhere, Category = "FastBee|Runtime")
	FString MachineClassKeyword = TEXT("BP_Machine");

	UPROPERTY(config, EditAnywhere, Category = "FastBee|Runtime")
	bool bRotateActorFromRpm = true;
};
