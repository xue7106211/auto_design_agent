# extract-mapping report

Generated: 2026-06-02T01:20:06.537Z

## Statistics

- Source data rows: 144
- Skipped empty rows: 0
- Emitted output rows: 1237
- SystemUIKIT-mapping.csv entries (SystemUIKIT): 22
- components.csv entries: 181

### Per-app counts

- Notes: 807
- Phone: 96
- Contacts: 58
- FileManager: 48
- Gallery: 32
- Messaging: 32
- Recorder: 28
- Settings: 22
- Calculator: 12
- Calendar: 12
- Clocks: 12
- Compass: 12
- Downloads: 12
- MiMover: 12
- Security: 12
- Weather: 8

## Diff vs app-mapping-stage1a.csv (legacy)

- legacy keys: 886
- matched: 699
- new-only (legacy 缺失或新捕获): 282
- legacy-only (新抽取中不存在): 187

### New-only examples (first 20)
- Calculator|TopBar|手机竖||全栏|TopBar_01
- Calculator|TopBar|Fold外竖||全栏|TopBar_01
- Calculator|TopBar|Fold内竖|C|全栏|TopBar_01
- Calculator|TopBar|Fold内横|C|全栏|TopBar_01
- Calculator|TopBar|Pad竖|C|全栏|TopBar_01
- Calculator|TopBar|Pad横|C|全栏|TopBar_01
- Calculator|NavigationBar|手机竖||全栏|TopBar_01
- Calculator|NavigationBar|Fold外竖||全栏|TopBar_01
- Calculator|NavigationBar|Fold内竖|C|全栏|TopBar_01
- Calculator|NavigationBar|Fold内横|C|全栏|TopBar_01
- Calculator|NavigationBar|Pad竖|C|全栏|TopBar_01
- Calculator|NavigationBar|Pad横|C|全栏|TopBar_01
- Calendar|TopBar|Fold内竖|C|全栏|TopBar_Calendar_01
- Calendar|TopBar|Fold内横|C|全栏|TopBar_Calendar_01
- Calendar|TopBar|Pad竖|C|全栏|TopBar_Calendar_01
- Calendar|TopBar|Pad横|C|全栏|TopBar_Calendar_01
- Calendar|NavigationBar|Fold内竖|C|全栏|TopBar_Calendar_01
- Calendar|NavigationBar|Fold内横|C|全栏|TopBar_Calendar_01
- Calendar|NavigationBar|Pad竖|C|全栏|TopBar_Calendar_01
- Calendar|NavigationBar|Pad横|C|全栏|TopBar_Calendar_01

### Legacy-only examples (first 20)
- FileManager|BottomBar|Fold内竖|NC|N栏|Sidebar_Component_NC_01
- FileManager|BottomBar|Fold内竖|C|全栏|TopBar_01
- FileManager|BottomBar|Fold内横|NC|N栏|Sidebar_Component_NC_01
- FileManager|BottomBar|Fold内横|C|全栏|TopBar_01
- FileManager|BottomBar|Pad竖|NL|N栏|Sidebar_Component_PAD_NLC_01
- FileManager|BottomBar|Pad竖|NL收起|N栏|Sidebar_Component_PAD_NLC_02
- FileManager|BottomBar|Pad竖|C|全栏|TopBar_05
- FileManager|BottomBar|Pad横|NL|N栏|Sidebar_Component_PAD_NLC_01
- FileManager|BottomBar|Pad横|NL收起|N栏|Sidebar_Component_PAD_NLC_02
- FileManager|BottomBar|Pad横|C|全栏|TopBar_05
- FileManager|NavigationBar|Pad竖|C|全栏|TopBar_05 标题栏
- FileManager|SearchBar|手机竖||全栏|Fab_01：白色
- FileManager|SearchBar|Fold外竖||全栏|Fab_01：白色
- FileManager|SearchBar|Fold内竖|C|全栏|TopBar_01 搜索图标
- FileManager|SearchBar|Pad竖|C|全栏|TopBar_05 搜索栏
- FileManager|SearchBar|Pad横|C|全栏|TopBar_05 搜索栏
- Notes|BottomBar|Pad竖|NLC|N栏|Sidebar_Component_PAD_NLC_01
- Notes|BottomBar|Pad竖|NLC收起|N栏|Sidebar_Component_PAD_NLC_00
- Notes|BottomBar|Pad横|NLC|N栏|Sidebar_Component_PAD_NLC_01
- Notes|BottomBar|Pad横|NLC收起|N栏|Sidebar_Component_PAD_NLC_00

## Warnings (12)

- row 9: 结构变化表-Notes.csv col 16: lane='L栏' invalid in NC framework, auto-corrected to 'C栏'
- row 9: 结构变化表-Notes.csv col 17: lane='L栏' invalid in NC framework, auto-corrected to 'C栏'
- row 9: 结构变化表-Notes.csv col 24: lane='L栏' invalid in NC framework, auto-corrected to 'C栏'
- row 9: 结构变化表-Notes.csv col 25: lane='L栏' invalid in NC framework, auto-corrected to 'C栏'
- row 25: 结构变化表-Notes.csv col 14: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 25: 结构变化表-Notes.csv col 15: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 25: 结构变化表-Notes.csv col 22: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 25: 结构变化表-Notes.csv col 23: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 28: 结构变化表-Notes.csv col 22: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 28: 结构变化表-Notes.csv col 23: lane='C栏' invalid in NL framework, auto-corrected to 'L栏'
- row 38: 结构变化表-Notes.csv col 8: lane='L栏' collapsed to '全栏' under C framework (Fold内 single-canvas)
- row 38: 结构变化表-Notes.csv col 11: lane='L栏' collapsed to '全栏' under C framework (Fold内 single-canvas)
