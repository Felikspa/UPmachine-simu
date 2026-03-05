using UnrealBuildTool;
using System.Collections.Generic;

public class AirCityExplorerTarget : TargetRules
{
	public AirCityExplorerTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.AddRange(new string[] { "AirCityExplorer" });
	}
}
