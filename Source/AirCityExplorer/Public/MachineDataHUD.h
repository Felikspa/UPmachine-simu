#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "MachineDataHUD.generated.h"

/**
 * 注塑机数据显示 HUD
 * 在屏幕上显示实时传感器数据
 */
UCLASS()
class AIRCITYEXPLORER_API AMachineDataHUD : public AHUD
{
	GENERATED_BODY()

public:
	AMachineDataHUD();

	virtual void DrawHUD() override;

	// 要显示的设备 ID
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine HUD")
	FString TargetDeviceId = TEXT("machine01");

	// HUD 位置和样式
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine HUD")
	FVector2D HUDPosition = FVector2D(50.0f, 50.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine HUD")
	float FontScale = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Machine HUD")
	bool bShowMachineData = true;

private:
	void DrawMachineData(float X, float Y);
	FLinearColor GetStatusColor(bool bRunning) const;
	FLinearColor GetTemperatureColor(float Temperature) const;
};
