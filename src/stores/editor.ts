import { ref } from "vue";
import { defineStore } from "pinia";

export const useEditorStore = defineStore(
  "editor",
  () => {
    const editorInstance = ref();

    const writing = ref(``);

    const selection = ref("");

    /**
     * 将当前选中的内容替换为新的文本。
     * * @param {Object} editor CKEditor 5 编辑器实例。
     * @param {string} newText 要插入的新文本。
     */
    function replaceSelectedText(newText: string) {
      // 获取当前选区
      const selection = editorInstance.value.model.document.selection;

      console.log(selection, newText);
      // 检查是否有内容被选中。如果光标折叠，我们只插入内容。
      if (selection.isCollapsed) {
        // 如果没有选中内容，直接在光标位置插入
        editorInstance.value.model.change((writer: any) => {
          writer.insertText(newText, selection.getFirstPosition());
        });
        return;
      }

      // 在一个 change() 块中执行所有操作，确保操作的原子性
      editorInstance.value.model.change((writer: any) => {
        // 获取选区范围
        const range = selection.getFirstRange();

        // 1. 先删除选中范围内的所有内容
        writer.remove(range);

        // 2. 然后在删除后光标所在的位置插入新内容
        const position = range.start;
        writer.insertText(newText, position);

        // 3. 将光标定位到新插入内容的末尾
        writer.setSelection(
          writer.createRange(position, position.getShiftedBy(newText.length))
        );
      });
    }

    return { editorInstance, writing, selection, replaceSelectedText };
  },
  {
    persist: false,
  }
);
