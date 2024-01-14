const Classes = {
  submenuTitle: "submenuttl"
}

const getFormElements = () => {
  return document.querySelectorAll("form");
}

const getSubmenuTitle = () => {
  const element = document.querySelector(`.${Classes.submenuTitle}`);
  if (element == null) return "";

  return element.textContent ?? "";
}

const isLecturePage = () => {
  return getSubmenuTitle() == "授業"
}