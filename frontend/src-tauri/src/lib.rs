use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

pub struct TrayState(pub std::sync::Mutex<tauri::tray::TrayIcon>);

// 메인 창을 보이고 포커스(활성화)한다. 트레이 좌클릭 / Dock 재실행 / 메뉴 "열기" 공용.
fn show_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let start_i = MenuItem::with_id(app, "start", "시작", true, None::<&str>)?;
            let pause_i = MenuItem::with_id(app, "pause", "일시정지/재개", true, None::<&str>)?;
            let stop_i = MenuItem::with_id(app, "stop", "종료", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let open_i = MenuItem::with_id(app, "open", "열기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "끝내기", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&start_i, &pause_i, &stop_i, &sep1, &open_i, &sep2, &quit_i],
            )?;

            // 트레이: 아이콘 없이 제목(🔥 + 카운트다운)만 → 메뉴바에 네모 없이 불꽃만.
            let tray = TrayIconBuilder::with_id("main-tray")
                .title("🔥")
                .menu(&menu)
                .show_menu_on_left_click(false) // 좌클릭=창 열기, 우클릭=메뉴
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "open" => show_main(app),
                    other => {
                        let _ = app.emit("tray-action", other.to_string());
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            app.manage(TrayState(std::sync::Mutex::new(tray)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_tray_title])
        .on_window_event(|window, event| {
            // 창을 닫으면 종료가 아니라 숨김 → 타이머(JS)가 계속 돎.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Dock 아이콘 클릭(창이 숨겨져 있을 때 포함) → 창 다시 표시.
            if let tauri::RunEvent::Reopen { .. } = event {
                show_main(app);
            }
        });
}

#[tauri::command]
fn set_tray_title(title: String, state: tauri::State<'_, TrayState>) -> Result<(), String> {
    let tray = state.0.lock().map_err(|e| e.to_string())?;
    tray.set_title(Some(title)).map_err(|e| e.to_string())
}
