// 下拉选项框美化 - Preset 专用版
// 运行时获取上游脚本，并在执行前限制接管范围。
// 仅接管 #settings_preset_openai；其他下拉框保持酒馆原生行为。

(async () => {
    "use strict";

    const SOURCE_URL = "https://raw.githubusercontent.com/uhhhh15/select/main/index.js";

    try {
        const response = await fetch(SOURCE_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`上游脚本请求失败：HTTP ${response.status}`);
        }

        let source = await response.text();

        // 1. 全局入口加白名单。放在多选框处理之前，包含 forceReplace 路径。
        const triggerBefore = [
            "        if (!targetSelect) return false;",
            "",
            "        const isMultiSelect = targetSelect.hasAttribute('multiple');"
        ].join("\n");

        const triggerAfter = [
            "        if (!targetSelect) return false;",
            "",
            "        // Preset 专用：拒绝接管所有非预设下拉框。",
            "        if (targetSelect.id !== 'settings_preset_openai') return false;",
            "",
            "        const isMultiSelect = targetSelect.hasAttribute('multiple');"
        ].join("\n");

        if (!source.includes(triggerBefore)) {
            throw new Error("未找到下拉框入口代码，已停止执行以避免错误修改。");
        }
        source = source.replace(triggerBefore, triggerAfter);

        // 2. 置顶改名观察器只追踪 Preset。
        const renameBefore =
            "targetDoc().querySelectorAll('#themes, #settings_preset_openai, #WIMultiSelector .range-block-range select')";
        const renameAfter =
            "targetDoc().querySelectorAll('#settings_preset_openai')";

        if (!source.includes(renameBefore)) {
            throw new Error("未找到置顶改名观察器代码，已停止执行以避免错误修改。");
        }
        source = source.replace(renameBefore, renameAfter);

        // 3. 禁用世界书多选框的独立 Select2 替换扫描。
        const scanPattern =
            /        function scanAndReplaceSelect2Displays\(\) \{[\s\S]*?\n        \}(?=\n        scanAndReplaceSelect2Displays\(\);)/;

        if (!scanPattern.test(source)) {
            throw new Error("未找到世界书多选框扫描函数，已停止执行以避免错误修改。");
        }
        source = source.replace(
            scanPattern,
            "        function scanAndReplaceSelect2Displays() {\n            // Preset 专用版：不扫描或替换世界书等其他多选框。\n            return;\n        }"
        );

        // 4. 通过 Blob 模块执行修改后的原脚本，避免 eval / new Function。
        const blob = new Blob([source], { type: "text/javascript" });
        const blobUrl = URL.createObjectURL(blob);
        try {
            await import(blobUrl);
        } finally {
            // 动态模块加载完成后即可释放 URL。
            URL.revokeObjectURL(blobUrl);
        }

        console.info("[下拉选项框美化·Preset 专用版] 已加载：仅接管 #settings_preset_openai。");
    } catch (error) {
        console.error("[下拉选项框美化·Preset 专用版] 加载失败：", error);
    }
})();
