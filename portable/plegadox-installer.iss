; PlegadoX: instalador per-user para Windows 10/11 x64 desde USB.
#ifndef MyAppVersion
  #error "Usar /DMyAppVersion=... con la versión de build-info.json"
#endif
#define MyAppName "PlegadoX"
#define MyAppExeName "PlegadoX.exe"

[Setup]
AppId={{43DFBFD0-BB06-4972-AACE-3940759D796E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=AMS Tecnologics Services
DefaultDirName={localappdata}\Programs\PlegadoX
DefaultGroupName=PlegadoX
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
MinVersion=10.0
ArchitecturesAllowed=x64compatible
OutputDir=..\dist\installer
OutputBaseFilename=PlegadoX-Instalador-Windows
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=plegadox.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; GroupDescription: "Accesos directos"; Flags: unchecked

[Files]
Source: "..\dist\PlegadoX-USB-Windows\PlegadoX.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\PlegadoX-USB-Windows\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "installed-mode.marker"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\PlegadoX"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\PlegadoX"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir PlegadoX"; Flags: nowait postinstall skipifsilent
