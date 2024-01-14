import { Urls } from "./urls.js";

/**
 * FCMの送信者ID。
 * Firebase projectの設定画面 > Cloud Messagingから確認できます。
 */
const SENDER_ID = "";

/**
 * CIST PortalのJSESSIONID。
 */
const JSESSIONID = "";

/**
 * FCMに登録します。
 * @returns {Promise<string>}
 */
const registerExtensionFCM = () => {
  return new Promise((resolve) => {
    chrome.gcm.register([SENDER_ID], resolve);
  });
}

/**
 * FCMにパスワードを送信します。
 * @param {Object} messageContent 
 * @returns {Promise<string>} messageId
 */
const sendPasswordFCM = (messageContent) => {
  return new Promise((resolve) => {
    chrome.gcm.send({
      data: {
        type: "notificate_password_enter",
        ...messageContent
      },
      destinationId: `${SENDER_ID}`,
      messageId: crypto.randomUUID(),
    }, resolve)
  });
}

/*
  Content Scriptから送信されたメッセージのイベントハンドラ
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type != "passworder_input_enter") return;
  if (!sender.tab) return;
  sendPasswordFCM(request.data)
    .then(() => {
      console.log(chrome.runtime.lastError);
      console.log(request.data);
      sendResponse({
        type: "passworder_completed_deliver"
      })
    });
});


/*
 * ここからFCM受信処理
*/

/**
 * `url`に渡されたURLを`fetch`し、Documentオブジェクトを取得します。
 * ポータルの内容取得に使用します。
 * リクエストヘッダの`JSESSIONID`に、`sessionID`で渡された文字列がセットされます。
 * @param {string} url
 * @param {string} sessionID ポータルのJSESSIONID。
 * @returns {Document} 生成されたDocument。
 */
const fetchPortalDocument = async (url, sessionID) => {
  const resp = await fetch(url, {
    headers: {
      JSESSIONID: sessionID
    }
  });
  const respText = await resp.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(respText);
  return document;
}

/**
 * @param {Document} document 
 * @param {string} lectureName 
 * @returns {string}
 */
const getLectureURL = (document, lectureName) => {
  const allAElements = [...document.querySelectorAll("a")];
  const a = allAElements.find(a => a.textContent == lectureName);
  return a.href;
}

/**
 * settlement クラスを持つdiv要素に対して、`lectureCount`回目の講義を表すものかを判定する。
 * 判定には、div直下のh4要素のtextContentに対し、正規表現を用いて判定する。
 * @param {HTMLDivElement} settlement 
 * @param {string} lectureName
 * @returns 
 */
const isLectureSettlement = (settlement, lectureName) => {
  return settlement.querySelector("h4")?.textContent == lectureName
};

/**
 * 
 * @param {string} courceName 
 * @param {string} lectureName 
 * @param {string} password 
 * @returns 
 */
const processReceivePassword = async (courceName, lectureName, password) => {
  console.group("process receive password");
  const documentCourcesForUser = await fetchPortalDocument(Urls.CourcesForUser);
  const lectureUrl = getLectureURL(documentCourcesForUser, courceName);


  const documentLecture = await fetchPortalDocument(lectureUrl);
  const settlements = [...documentLecture.querySelectorAll(".settlement")];

  const lectureSettlement = settlements.find(settlement => isLectureSettlement(settlement, lectureName));

  // settlement下にある3個目のtbodyのform要素が、パスワード送信フォームである
  const lectureForm = lectureSettlement.querySelector("tbody:nth-of-type(3) form");
  if (!lectureForm) return;

  const formActionTarget = lectureForm.action;
  if (!formActionTarget) return;

  // パスワードリクエストを代理送信
  await fetch(formActionTarget, {
    body: `${lectureForm.id}_hf_0=&password=${password}&saveButton=1`,
    headers: {
      JSESSIONID: sessionID
    }
  });
  console.groupEnd();
}

chrome.gcm.onMessage.addListener(message => {
  // password receive
  console.log(message);
  if (message.data.type != "notificate_password_enter") return;
  const { courceName, lectureName, password } = message.data.data;
  processReceivePassword(courceName, lectureName, password);
});

registerExtensionFCM().then(console.log);