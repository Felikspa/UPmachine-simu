#include "MachineGameMode.h"
#include "MachineDataHUD.h"

AMachineGameMode::AMachineGameMode()
{
	// 设置默认 HUD 类
	HUDClass = AMachineDataHUD::StaticClass();
}
