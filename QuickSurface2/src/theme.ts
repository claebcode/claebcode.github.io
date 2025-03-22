let colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
let useSystemTheme = true;
let curTheme = "light";

function setColorTheme(theme:string){
    console.log("old theme: ",curTheme);
    document.body.classList.remove("theme-"+curTheme);
    console.log("SET THEME: ",theme);
    curTheme = theme;
    document.body.classList.add("theme-"+curTheme);
}
setColorTheme(useSystemTheme ? colorSchemeMedia.matches ? "dark" : "light" : "light");

colorSchemeMedia.addEventListener("change", ({ matches }) => {
    if(!useSystemTheme) return;
    setColorTheme(matches?"dark":"light");
});