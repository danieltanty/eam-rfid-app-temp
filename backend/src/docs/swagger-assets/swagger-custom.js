const observer = new MutationObserver(() => {
  const container = document.querySelector(".swagger-ui");

  if (container) {
    observer.disconnect();

    const header = document.createElement("div");

    header.innerHTML = `
      <div id="custom-header" style="
          background: linear-gradient(90deg, #377fb1, #004b8f);
          color: white;
          padding: 20px 24px;
          display: flex;
          align-items: center;
      ">
          <img src="/swagger/logo.png" style="height:50px; margin-right:12px;" />

          <div>
              <div style="font-size:18px; margin-left: 5px; font-weight:600;">
                  YNY TECHNOLOGY SDN BHD
              </div>

              <div style="font-size:12px; margin-left: 5px; opacity:0.8;">
                  Toyota Tsusho RFID Solution API Documentation
              </div>
          </div>

          <div style="margin-left:auto; display:flex; align-items:center; gap:12px;">
              <div style="
                font-size:12px;
                padding:6px 10px;
                border-radius:999px;
                background: rgba(255,255,255,0.15);
                border: 1px solid rgba(255,255,255,0.25);
                backdrop-filter: blur(6px);
                font-weight: 600;
                letter-spacing: 0.3px;
            ">
                Version 1.0.0
            </div>

              <div id="header-authorize"></div>
          </div>
      </div>
    `;

    container.prepend(header);

    setTimeout(() => {
      const authorizeBtn = document.querySelector(".swagger-ui .authorize");
      const authorizeContainer = document.querySelector("#header-authorize");

      if (authorizeBtn && authorizeContainer) {
        authorizeContainer.appendChild(authorizeBtn);
      }
    }, 300);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});