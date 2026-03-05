#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "MachinePartController.generated.h"

class UStaticMeshComponent;

/**
 * 注塑机部件级控制组件
 * 根据 MQTT 数据自动控制机器各个部件的运动和视觉效果
 */
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class AIRCITYEXPLORER_API UMachinePartController : public UActorComponent
{
	GENERATED_BODY()

public:
	UMachinePartController();

	virtual void BeginPlay() override;
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// 设备 ID
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control")
	FString DeviceId;

	// 螺杆控制参数
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Screw")
	float ScrewMaxPosition = 100.0f; // 螺杆最大位置（mm）

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Screw")
	float ScrewMovementScale = 1.0f; // 位置缩放系数

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Screw")
	bool bEnableScrewRotation = true; // 是否启用螺杆旋转

	// 注射单元控制参数
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Injection")
	float InjectionMaxPosition = 200.0f; // 注射单元最大位置（mm）

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Injection")
	float InjectionMovementScale = 1.0f; // 位置缩放系数

	// 温度可视化参数
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Temperature")
	bool bEnableTemperatureVisualization = true;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Temperature")
	float LowTemperature = 50.0f; // 低温阈值（蓝色）

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine Control|Temperature")
	float HighTemperature = 250.0f; // 高温阈值（红色）

	// 蓝图可调用接口
	UFUNCTION(BlueprintCallable, Category = "Machine Control")
	void UpdateMachineState(float ScrewPos, float InjectionPos, float BarrelTemp, float MoldTemp);

	UFUNCTION(BlueprintCallable, Category = "Machine Control")
	void UpdateScrewRotation(float Rpm);

private:
	void CacheComponentReferences();
	void UpdateScrewPosition(float Position);
	void UpdateInjectionUnitPosition(float Position);
	void UpdateTemperatureVisualization(float BarrelTemp, float MoldTemp);
	FLinearColor GetTemperatureColor(float Temperature) const;

	// 缓存的组件引用
	TArray<UStaticMeshComponent*> ScrewComponents;
	TArray<UStaticMeshComponent*> InjectionComponents;
	TArray<UStaticMeshComponent*> BarrelComponents;
	TArray<UStaticMeshComponent*> MoldComponents;

	// 初始位置缓存
	TMap<UStaticMeshComponent*, FVector> InitialPositions;

	// 初始旋转缓存
	TMap<UStaticMeshComponent*, FRotator> InitialRotations;

	// 当前螺杆转速
	float CurrentScrewRpm = 0.0f;

	bool bComponentsCached = false;
};
