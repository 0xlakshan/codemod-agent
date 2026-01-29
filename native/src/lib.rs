use napi::bindgen_prelude::*;
use napi_derive::napi;
use similar::{ChangeTag, TextDiff};

#[napi(object)]
pub struct DiffConfig {
  pub context_lines: Option<u32>,
  pub max_lines_per_file: Option<u32>,
}

#[napi(object)]
pub struct FileDiff {
  pub path: String,
  pub diff_text: String,
  pub additions: u32,
  pub deletions: u32,
}

#[napi]
pub async fn generate_diff(
  file_path: String,
  original: String,
  modified: String,
  config: Option<DiffConfig>,
) -> Result<FileDiff> {
  tokio::task::spawn_blocking(move || {
    let context_lines = config.as_ref().and_then(|c| c.context_lines).unwrap_or(3) as usize;
    let max_lines = config.as_ref().and_then(|c| c.max_lines_per_file).unwrap_or(500) as usize;

    let diff = TextDiff::from_lines(&original, &modified);
    let mut diff_text = String::new();
    let mut additions = 0u32;
    let mut deletions = 0u32;
    let mut line_count = 0usize;

    diff_text.push_str(&format!("--- [before] {}\n", file_path));
    diff_text.push_str(&format!("+++ [after]  {}\n", file_path));

    for hunk in diff.unified_diff().context_radius(context_lines).iter_hunks() {
      diff_text.push_str(&hunk.header().to_string());

      for change in hunk.iter_changes() {
        if max_lines > 0 && line_count >= max_lines {
          diff_text.push_str("\n... (diff truncated)\n");
          break;
        }

        let sign = match change.tag() {
          ChangeTag::Delete => {
            deletions += 1;
            "-"
          }
          ChangeTag::Insert => {
            additions += 1;
            "+"
          }
          ChangeTag::Equal => " ",
        };

        let line = change.to_string_lossy();
        diff_text.push_str(&format!("{}{}", sign, line));

        if !line.ends_with('\n') {
          diff_text.push('\n');
        }

        line_count += 1;
      }
    }

    Ok(FileDiff {
      path: file_path,
      diff_text,
      additions,
      deletions,
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task failed: {}", e)))?
}
