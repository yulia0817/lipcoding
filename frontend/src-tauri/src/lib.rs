use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

pub struct TrayState(pub std::sync::Mutex<tauri::tray::TrayIcon>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let start_i = MenuItem::with_id(app, "start", "시작", true, None::<&str>)?;
            let pause_i = MenuItem::with_id(app, "pause", "일시정지/재개", true, None::<&str>)?;
            let stop_i = MenuItem::with_id(app, "stop", "종료", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let open_i = MenuItem::with_id(app, "open", "열기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "끝내기", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&start_i, &pause_i, &stop_i, &sep, &open_i, &sep, &quit_i],
            )?;

            let tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .title("🔥")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    other => {
                        let _ = app.emit("tray-action", other.to_string());
                    }
                })
                .build(app)?;

            app.manage(TrayState(std::sync::Mutex::new(tray)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_tray_title])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_tray_title(title: String, state: tauri::State<'_, TrayState>) -> Result<(), String> {
    let tray = state.0.lock().map_err(|e| e.to_string())?;
    tray.set_title(Some(title)).map_err(|e| e.to_string())
}
