#include "MachinePartController.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/Actor.h"
#include "Materials/MaterialInstanceDynamic.h"

UMachinePartController::UMachinePartController()
{
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.TickGroup = TG_PostUpdateWork;
}

void UMachinePartController::BeginPlay()
{
	Super::BeginPlay();
	CacheComponentReferences();
}

void UMachinePartController::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	// 更新螺杆旋转
	if (bEnableScrewRotation && !FMath::IsNearlyZero(CurrentScrewRpm))
	{
		float DegreesPerSecond = CurrentScrewRpm * 6.0f; // RPM 转换为度/秒
		float RotationDelta = DegreesPerSecond * DeltaTime;

		for (UStaticMeshComponent* Component : ScrewComponents)
		{
			if (Component != nullptr)
			{
				FRotator CurrentRotation = Component->GetRelativeRotation();
				CurrentRotation.Roll += RotationDelta; // 沿螺杆轴向旋转
				Component->SetRelativeRotation(CurrentRotation);
			}
		}
	}
}

void UMachinePartController::CacheComponentReferences()
{
	if (bComponentsCached)
	{
		return;
	}

	AActor* Owner = GetOwner();
	if (Owner == nullptr)
	{
		return;
	}

	// 获取所有 StaticMeshComponent
	TArray<UStaticMeshComponent*> AllComponents;
	Owner->GetComponents<UStaticMeshComponent>(AllComponents);

	UE_LOG(LogTemp, Log, TEXT("MachinePartController: Found %d StaticMeshComponents"), AllComponents.Num());

	// 根据组件名称分类
	for (UStaticMeshComponent* Component : AllComponents)
	{
		if (Component == nullptr)
		{
			continue;
		}

		FString ComponentName = Component->GetName();

		// 螺杆相关组件（可能的命名：Luogan, Screw, 或其他）
		// 暂时使用通用匹配，后续可根据实际命名调整
		if (ComponentName.Contains(TEXT("Luogan")) ||
		    ComponentName.Contains(TEXT("Screw")) ||
		    ComponentName.Contains(TEXT("A670735"))) // 根据实际组件名调整
		{
			ScrewComponents.Add(Component);
			InitialPositions.Add(Component, Component->GetRelativeLocation());
			InitialRotations.Add(Component, Component->GetRelativeRotation());
		}

		// 注射单元组件
		if (ComponentName.Contains(TEXT("Zhushe")) ||
		    ComponentName.Contains(TEXT("Injection")))
		{
			InjectionComponents.Add(Component);
			InitialPositions.Add(Component, Component->GetRelativeLocation());
		}

		// 料筒组件
		if (ComponentName.Contains(TEXT("Liaotong")) ||
		    ComponentName.Contains(TEXT("Barrel")) ||
		    ComponentName.Contains(TEXT("A670714"))) // 根据实际组件名调整
		{
			BarrelComponents.Add(Component);
		}

		// 模具组件
		if (ComponentName.Contains(TEXT("Moju")) ||
		    ComponentName.Contains(TEXT("Mold")) ||
		    ComponentName.Contains(TEXT("A670715"))) // 根据实际组件名调整
		{
			MoldComponents.Add(Component);
		}
	}

	UE_LOG(LogTemp, Log, TEXT("MachinePartController: Cached - Screw: %d, Injection: %d, Barrel: %d, Mold: %d"),
		ScrewComponents.Num(), InjectionComponents.Num(), BarrelComponents.Num(), MoldComponents.Num());

	bComponentsCached = true;
}

void UMachinePartController::UpdateMachineState(float ScrewPos, float InjectionPos, float BarrelTemp, float MoldTemp)
{
	if (!bComponentsCached)
	{
		CacheComponentReferences();
	}

	UpdateScrewPosition(ScrewPos);
	UpdateInjectionUnitPosition(InjectionPos);

	if (bEnableTemperatureVisualization)
	{
		UpdateTemperatureVisualization(BarrelTemp, MoldTemp);
	}
}

void UMachinePartController::UpdateScrewPosition(float Position)
{
	// 将位置数据映射到实际移动距离
	float NormalizedPosition = FMath::Clamp(Position / ScrewMaxPosition, 0.0f, 1.0f);
	float MovementDistance = NormalizedPosition * ScrewMovementScale * 100.0f; // 转换为 UE4 单位（cm）

	UE_LOG(LogTemp, Log, TEXT("MachinePartController: UpdateScrewPosition - Position=%.2f, Movement=%.2f cm, Components=%d"),
		Position, MovementDistance, ScrewComponents.Num());

	for (UStaticMeshComponent* Component : ScrewComponents)
	{
		if (Component == nullptr)
		{
			continue;
		}

		FVector* InitialPos = InitialPositions.Find(Component);
		if (InitialPos != nullptr)
		{
			// 沿 X 轴移动（假设螺杆沿 X 轴运动，可根据实际情况调整）
			FVector NewPosition = *InitialPos + FVector(MovementDistance, 0.0f, 0.0f);
			Component->SetRelativeLocation(NewPosition);
			UE_LOG(LogTemp, Verbose, TEXT("  - Moved %s from (%.1f,%.1f,%.1f) to (%.1f,%.1f,%.1f)"),
				*Component->GetName(), InitialPos->X, InitialPos->Y, InitialPos->Z,
				NewPosition.X, NewPosition.Y, NewPosition.Z);
		}
	}
}

void UMachinePartController::UpdateInjectionUnitPosition(float Position)
{
	// 将位置数据映射到实际移动距离
	float NormalizedPosition = FMath::Clamp(Position / InjectionMaxPosition, 0.0f, 1.0f);
	float MovementDistance = NormalizedPosition * InjectionMovementScale * 100.0f; // 转换为 UE4 单位（cm）

	UE_LOG(LogTemp, Log, TEXT("MachinePartController: UpdateInjectionUnitPosition - Position=%.2f, Movement=%.2f cm, Components=%d"),
		Position, MovementDistance, InjectionComponents.Num());

	for (UStaticMeshComponent* Component : InjectionComponents)
	{
		if (Component == nullptr)
		{
			continue;
		}

		FVector* InitialPos = InitialPositions.Find(Component);
		if (InitialPos != nullptr)
		{
			// 沿 X 轴移动（假设注射单元沿 X 轴运动，可根据实际情况调整）
			FVector NewPosition = *InitialPos + FVector(MovementDistance, 0.0f, 0.0f);
			Component->SetRelativeLocation(NewPosition);
			UE_LOG(LogTemp, Verbose, TEXT("  - Moved %s from (%.1f,%.1f,%.1f) to (%.1f,%.1f,%.1f)"),
				*Component->GetName(), InitialPos->X, InitialPos->Y, InitialPos->Z,
				NewPosition.X, NewPosition.Y, NewPosition.Z);
		}
	}
}

void UMachinePartController::UpdateTemperatureVisualization(float BarrelTemp, float MoldTemp)
{
	// 更新料筒温度颜色
	FLinearColor BarrelColor = GetTemperatureColor(BarrelTemp);
	UE_LOG(LogTemp, Log, TEXT("MachinePartController: Barrel Temp=%.1f°C, Color=(%.2f,%.2f,%.2f), Components=%d"),
		BarrelTemp, BarrelColor.R, BarrelColor.G, BarrelColor.B, BarrelComponents.Num());

	for (UStaticMeshComponent* Component : BarrelComponents)
	{
		if (Component == nullptr)
		{
			continue;
		}

		// 方法 1: 直接设置组件颜色（覆盖材质）
		Component->SetVectorParameterValueOnMaterials(FName("BaseColor"), FVector(BarrelColor.R, BarrelColor.G, BarrelColor.B));
		Component->SetVectorParameterValueOnMaterials(FName("EmissiveColor"), FVector(BarrelColor.R, BarrelColor.G, BarrelColor.B));

		// 方法 2: 设置组件自定义颜色（如果材质支持 VertexColor）
		Component->SetCustomPrimitiveDataVector4(0, BarrelColor);
	}

	// 更新模具温度颜色
	FLinearColor MoldColor = GetTemperatureColor(MoldTemp);
	UE_LOG(LogTemp, Log, TEXT("MachinePartController: Mold Temp=%.1f°C, Color=(%.2f,%.2f,%.2f), Components=%d"),
		MoldTemp, MoldColor.R, MoldColor.G, MoldColor.B, MoldComponents.Num());

	for (UStaticMeshComponent* Component : MoldComponents)
	{
		if (Component == nullptr)
		{
			continue;
		}

		// 方法 1: 直接设置组件颜色（覆盖材质）
		Component->SetVectorParameterValueOnMaterials(FName("BaseColor"), FVector(MoldColor.R, MoldColor.G, MoldColor.B));
		Component->SetVectorParameterValueOnMaterials(FName("EmissiveColor"), FVector(MoldColor.R, MoldColor.G, MoldColor.B));

		// 方法 2: 设置组件自定义颜色（如果材质支持 VertexColor）
		Component->SetCustomPrimitiveDataVector4(0, MoldColor);
	}
}

void UMachinePartController::UpdateScrewRotation(float Rpm)
{
	CurrentScrewRpm = Rpm;
	UE_LOG(LogTemp, Log, TEXT("MachinePartController: UpdateScrewRotation - RPM=%.1f"), Rpm);
}

FLinearColor UMachinePartController::GetTemperatureColor(float Temperature) const
{
	// 温度映射到颜色：蓝色（低温）→ 绿色 → 黄色 → 橙色 → 红色（高温）
	float NormalizedTemp = FMath::Clamp((Temperature - LowTemperature) / (HighTemperature - LowTemperature), 0.0f, 1.0f);

	FLinearColor LowColor = FLinearColor(0.0f, 0.5f, 1.0f); // 蓝色
	FLinearColor MidColor = FLinearColor(1.0f, 1.0f, 0.0f); // 黄色
	FLinearColor HighColor = FLinearColor(1.0f, 0.0f, 0.0f); // 红色

	if (NormalizedTemp < 0.5f)
	{
		return FMath::Lerp(LowColor, MidColor, NormalizedTemp * 2.0f);
	}
	else
	{
		return FMath::Lerp(MidColor, HighColor, (NormalizedTemp - 0.5f) * 2.0f);
	}
}
