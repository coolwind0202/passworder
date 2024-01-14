/**
 * パスワードの送信ボタンが押下されたことをService Workerに通知します。
 * @param {string} courceTitle 
 * @param {string} lectureName 
 * @param {string} password 
 */
const handlePasswordEnter = async (courceTitle, lectureName, password) => {
  const resp = await chrome.runtime.sendMessage({ type: "passworder_input_enter", data: { courceTitle, lectureName, password } });
  console.log(resp);
}

/**
 * `sendButton`ボタンが存在する回の表示名を、`.settlement`下の`h4`要素の内容を元に取得します。
 * @param {HTMLButtonElement} sendButton 
 * @example getLectureButton(button) // -> \n\t\t\t\t\t\t\t\tプログラミングとアルゴリズム基礎\n\t\t\t\t\t\t\t
 */
const getLectureName = (sendButton) => {
  const lectureName = sendButton.closest(".settlement")?.querySelector("h4")?.textContent;
  return lectureName ?? null;
}

/**
 * 講義名を、`.mainttle2`クラスを持つ`h3`要素の内容を元に取得します。
 */
const getCourceTitle = () => {
  const courceTitle = document.querySelector("h3.mainttl2")?.textContent;
  return courceTitle ?? null;
}

const main = () => {
  /**
   * @type {NodeListOf<HTMLButtonElement>}
   */
  const buttons = document.querySelectorAll("button[name='saveButton']")
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const passwordInput = button.form?.querySelector("input[type='password']");
      if (!passwordInput) return;

      const courceTitle = getCourceTitle();
      const lectureName = getLectureName(button);

      if (lectureName && courceTitle)
        handlePasswordEnter(courceTitle, lectureName, passwordInput.value);
    });
  });
}

if (isLecturePage()) main();