#include "MachineDataHUD.h"
#include "FastBeeMqttSubsystem.h"
#include "Engine/Canvas.h"
#include "Engine/Font.h"
#include "Kismet/GameplayStatics.h"

AMachineDataHUD::AMachineDataHUD()
{
	PrimaryActorTick.bCanEverTick = true;
}

void AMachineDataHUD::DrawHUD()
{
	Super::DrawHUD();

	if (!bShowMachineData)
	{
		return;
	}

	DrawMachineData(HUDPosition.X, HUDPosition.Y);
}

void AMachineDataHUD::DrawMachineData(float X, float Y)
{
	UGameInstance* GameInstance = GetWorld()->GetGameInstance();
	if (GameInstance == nullptr)
	{
		return;
	}

	UFastBeeMqttSubsystem* MqttSubsystem = GameInstance->GetSubsystem<UFastBeeMqttSubsystem>();
	if (MqttSubsystem == nullptr)
	{
		return;
	}

	// 获取机器状态数据
	float Rpm = 0.0f;
	bool bRunning = false;
	float BarrelTemp = 0.0f;
	float MoldTemp = 0.0f;
	float InjectionPressure = 0.0f;

	bool bHasData = MqttSubsystem->GetMachineState(TargetDeviceId, Rpm, bRunning, BarrelTemp, MoldTemp, InjectionPressure);

	if (!bHasData)
	{
		// 没有数据时显示提示
		FString NoDataText = FString::Printf(TEXT("等待设备数据: %s"), *TargetDeviceId);
		DrawText(NoDataText, FLinearColor::Yellow, X, Y, nullptr, FontScale);
		return;
	}

	float LineHeight = 25.0f * FontScale;
	float CurrentY = Y;

	// 绘制标题
	FString Title = FString::Printf(TEXT("=== 注塑机数字孪生 - %s ==="), *TargetDeviceId);
	DrawText(Title, FLinearColor::White, X, CurrentY, nullptr, FontScale * 1.2f);
	CurrentY += LineHeight * 1.5f;

	// 运行状态
	FLinearColor StatusColor = GetStatusColor(bRunning);
	FString StatusText = bRunning ? TEXT("● 运行中") : TEXT("○ 停止");
	FString StatusLine = FString::Printf(TEXT("运行状态: %s"), *StatusText);
	DrawText(StatusLine, StatusColor, X, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	// 转速
	FString RpmLine = FString::Printf(TEXT("转速: %.0f RPM"), Rpm);
	DrawText(RpmLine, FLinearColor::White, X, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	CurrentY += LineHeight * 0.5f; // 分隔

	// 温度数据
	DrawText(TEXT("--- 温度数据 ---"), FLinearColor(0.7f, 0.7f, 0.7f), X, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	FLinearColor BarrelColor = GetTemperatureColor(BarrelTemp);
	FString BarrelLine = FString::Printf(TEXT("料筒温度: %.1f °C"), BarrelTemp);
	DrawText(BarrelLine, BarrelColor, X + 20, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	FLinearColor MoldColor = GetTemperatureColor(MoldTemp);
	FString MoldLine = FString::Printf(TEXT("模具温度: %.1f °C"), MoldTemp);
	DrawText(MoldLine, MoldColor, X + 20, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	CurrentY += LineHeight * 0.5f; // 分隔

	// 压力数据
	DrawText(TEXT("--- 压力数据 ---"), FLinearColor(0.7f, 0.7f, 0.7f), X, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	FString PressureLine = FString::Printf(TEXT("注射压力: %.1f MPa"), InjectionPressure);
	DrawText(PressureLine, FLinearColor::White, X + 20, CurrentY, nullptr, FontScale);
	CurrentY += LineHeight;

	// 获取连接的设备列表
	TArray<FString> ConnectedDevices = MqttSubsystem->GetConnectedDevices();
	if (ConnectedDevices.Num() > 0)
	{
		CurrentY += LineHeight * 0.5f;
		FString DevicesLine = FString::Printf(TEXT("已连接设备: %d"), ConnectedDevices.Num());
		DrawText(DevicesLine, FLinearColor(0.5f, 1.0f, 0.5f), X, CurrentY, nullptr, FontScale * 0.8f);
	}
}

FLinearColor AMachineDataHUD::GetStatusColor(bool bRunning) const
{
	return bRunning ? FLinearColor::Green : FLinearColor::Red;
}

FLinearColor AMachineDataHUD::GetTemperatureColor(float Temperature) const
{
	// 温度颜色映射
	if (Temperature < 50.0f)
	{
		return FLinearColor(0.5f, 0.8f, 1.0f); // 蓝色
	}
	else if (Temperature < 100.0f)
	{
		return FLinearColor(0.5f, 1.0f, 0.8f); // 青色
	}
	else if (Temperature < 150.0f)
	{
		return FLinearColor(1.0f, 1.0f, 0.5f); // 黄色
	}
	else if (Temperature < 200.0f)
	{
		return FLinearColor(1.0f, 0.7f, 0.3f); // 橙色
	}
	else
	{
		return FLinearColor(1.0f, 0.3f, 0.3f); // 红色
	}
}
