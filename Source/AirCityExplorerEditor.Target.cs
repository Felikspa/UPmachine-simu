using UnrealBuildTool;
using System.Collections.Generic;

public class AirCityExplorerEditorTarget : TargetRules
{
	public AirCityExplorerEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.AddRange(new string[] { "AirCityExplorer" });
	}
}
