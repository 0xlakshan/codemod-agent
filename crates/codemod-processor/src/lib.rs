//ISSUE: npx codemod@latest hangs when executed from a Rust parent process
// the codemod CLI detects the Rust process and enters an indefinite wait state
// current workaround - Use Node.js child_process to spawn codemod instead of calling from Rust
// This bypasses the parent process detection issue until upstream fix is available

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

#[napi]
pub fn apply_codemod(file_content: String, codemod_command: String) -> Result<String> {
    let temp_dir = PathBuf::from(".temp");
    let temp_file = temp_dir.join("temp.ts");

    fs::create_dir_all(&temp_dir)
        .map_err(|e| Error::from_reason(format!("Failed to create temp dir: {}", e)))?;

    fs::write(&temp_file, &file_content)
        .map_err(|e| Error::from_reason(format!("Failed to write temp file: {}", e)))?;

    let child = Command::new("npx")
        .arg("codemod@latest")
        .arg("run")
        .arg(&codemod_command)
        .arg("--allow-dirty")
        .arg("--no-interactive")
        .arg("--allow-fs")
        .arg("--allow-child-process")
        .current_dir(&temp_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| Error::from_reason(format!("Failed to spawn codemod: {}", e)))?;

    let output = child
        .wait_with_output()
        .map_err(|e| Error::from_reason(format!("Failed to wait for codemod: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        fs::remove_dir_all(&temp_dir).ok();
        return Err(Error::from_reason(format!("Codemod failed: {}", stderr)));
    }

    let modified_content = fs::read_to_string(&temp_file)
        .map_err(|e| Error::from_reason(format!("Failed to read modified file: {}", e)))?;

    fs::remove_dir_all(&temp_dir)
        .map_err(|e| Error::from_reason(format!("Failed to cleanup temp dir: {}", e)))?;

    Ok(modified_content)
}
