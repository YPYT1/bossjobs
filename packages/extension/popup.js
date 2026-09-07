const DOMAINS = {
  boss: [".zhipin.com", "www.zhipin.com", ".zhipin.com"],
  zhilian: [".zhaopin.com", "www.zhaopin.com"],
  yupao: [".yupao.com", ".ypzp.com", "www.yupao.com"],
};

async function exportCookies(platform) {
  const domains = DOMAINS[platform] || [];
  const all = [];
  for (const domain of domains) {
    const list = await chrome.cookies.getAll({ domain });
    all.push(...list);
  }
  // de-dupe by name+domain
  const seen = new Set();
  const uniq = [];
  for (const c of all) {
    const key = `${c.domain}|${c.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || "/",
    });
  }
  return JSON.stringify(uniq, null, 2);
}

document.querySelectorAll("button[data-platform]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const platform = btn.getAttribute("data-platform");
    const text = await exportCookies(platform);
    document.getElementById("out").value = text;
  });
});

document.getElementById("copy").addEventListener("click", async () => {
  const text = document.getElementById("out").value;
  await navigator.clipboard.writeText(text);
  document.getElementById("copy").textContent = "已复制";
  setTimeout(() => {
    document.getElementById("copy").textContent = "复制";
  }, 1500);
});
