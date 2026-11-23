import { useRef } from "react";

export default function BulletTextarea({
  value = "",
  onChange,
  placeholder = "- Nhập công việc đã hoàn thành...",
  rows = 5,
  className = "",
}) {
  const textareaRef = useRef(null);

  const setCursor = (pos) => {
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
      }
    });
  };

  // 1. Khi click vào ô trống -> tự điền sẵn "- "
  const handleFocus = () => {
    if (!value.trim()) {
      onChange("- ");
      setCursor(2);
    }
  };

  // 2. Khi gõ ký tự đầu tiên vào ô đang trống -> tự gắn "- " ở đầu
  const handleChange = (e) => {
    const nextValue = e.target.value;

    if (!value && nextValue && !nextValue.startsWith("- ")) {
      const formatted = `- ${nextValue}`;
      onChange(formatted);
      setCursor(formatted.length);
      return;
    }

    onChange(nextValue);
  };

  // 3. Khi nhấn Enter -> xuống dòng và tự thêm "- " ngay tại vị trí con trỏ
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;

      // Kiểm tra dòng hiện tại: nếu chỉ có mỗi "- " rồi nhấn Enter nữa thì xóa dấu thừa
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = value.slice(lineStart, selectionStart);

      if (currentLine.trim() === "-") {
        const cleaned = value.slice(0, lineStart) + value.slice(selectionEnd);
        onChange(cleaned);
        setCursor(lineStart);
        return;
      }

      const insertion = "\n- ";
      const updated =
        value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);

      onChange(updated);
      setCursor(selectionStart + insertion.length);
    }
  };

  // 4. Khi dán (Paste) nhiều dòng -> tự thêm "- " cho từng dòng chưa có
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.includes("\n")) return;

    e.preventDefault();
    const { selectionStart, selectionEnd } = e.target;

    const lines = pasted
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (line.startsWith("- ") ? line : `- ${line}`));

    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const prefix = before && !before.endsWith("\n") && before.trim() !== "-" ? "\n" : "";
    const baseBefore = before.trim() === "-" ? "" : before;

    const inserted = `${prefix}${lines.join("\n")}`;
    const updated = `${baseBefore}${inserted}${after}`;

    onChange(updated);
    setCursor(baseBefore.length + inserted.length);
  };

  // 5. Khi rời khỏi ô mà chỉ còn mỗi dấu "-" trống -> xóa sạch để hiện placeholder
  const handleBlur = () => {
    if (value.trim() === "-") {
      onChange("");
    }
  };

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onFocus={handleFocus}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}
    />
  );
}