/**
 * The Setup tab: Sheet sync, appearance, announcer and export.
 */
function setup() {
  return `<div class=sec><b>Google Sheets sync (optional)</b>
  <ol>
    <li>Create a new Google Sheet.</li>
    <li>Open Extensions, then Apps Script. Delete the default code, paste the script below, and save.</li>
    <li>Click Deploy, then New deployment, choose Web app. Set Execute as to Me and Who has access to Anyone. Deploy and approve the permissions (if Google warns, choose Advanced, then continue).</li>
    <li>Copy the Web app URL (it ends in /exec), paste it below, then Save and Sync now.</li>
  </ol>
  <p class=mut>Updating from an earlier version? Paste this script over the old one and save. Then choose Deploy, Manage deployments, Edit, set Version to New version, and Deploy. Your URL stays the same.</p>
  <textarea id=sc rows=7 readonly>${esc(SCRIPT)}</textarea>
  <div class="d-flex flex-wrap gap-2 align-items-center" style="margin:8px 0 14px">
    <button data-a=copy>Copy script</button>
    <span class=mut>
      Everyone who uses this file does these steps with their own Sheet, so their data stays in their own Drive. 
      If you update the script later, paste it again, then choose Deploy, Manage deployments, Edit, New version.
    </span>
  </div>
  <div class="d-flex flex-wrap gap-2 align-items-center">
    <input id=url style="flex:1;min-width:240px" placeholder="https://script.google.com/macros/s/.../exec" value="${esc(url)}">
    <button data-a=saveurl>Save</button>
    <button class=pri data-a=sync>Sync now</button>
  </div>
  <p class=mut>Anyone with your URL can add rows to your Sheet, so keep it private.</p>
  </div>

  <div class=sec><h4>Sync another device</h4>
    <p class=mut>Save your URL above, then scan this code with your phone or tablet. It opens the app there with your Sheet already set up, and syncs.</p>
    <button data-a=qr>Show QR code</button>
    <div id=qr style="margin-top:10px"></div>
  </div>

  <div class=sec><h4>Appearance</h4>
    <div class="d-flex flex-wrap gap-2 align-items-center">${[
    ['auto', 'Auto'],
    ['light', 'Light'],
    ['dark', 'Dark'],
  ]
      .map(
          ([k, l]) =>
              `<button data-a=theme data-v=${k} class="${theme === k ? 'on' : ''}">${l}</button>`,
      )
      .join('')}
    </div>
    <p class=mut style="margin:.5rem 0 0">
      Auto follows your device. Dark is easier on the eyes in a pub or on a TV.
    </p>
  </div>

  <div class=sec><h4>Announcer</h4>${
      canSpeak()
          ? `<div class="d-flex flex-wrap gap-2 align-items-center">
          <button data-a=voice class="${voiceOn ? 'on' : ''}">${voiceOn ? 'Voice on' : 'Voice off'}</button>
          <select id=vs>${
              rankedVoices()
                  .map(
                      (v) =>
                          `<option value="${esc(v.name)}"${
                              pickVoice() && pickVoice().name === v.name
                                  ? ' selected'
                                  : ''
                          }>${esc(v.name)} (${esc(v.lang)})${
                              isNat(v) ? ' · natural' : ''
                          }</option>`,
                  )
                  .join('') || '<option>Default voice</option>'
          }</select>
          <select id=vr title="Speaking speed">${[
            [0.9, 'Slower'],
            [1, 'Normal'],
            [1.15, 'Faster'],
            [1.3, 'Fastest'],
          ]
              .map(([r, l]) => `<option value=${r}${
                  voiceRate === r ? ' selected' : ''
              }>${l}</option>`)
              .join('')}
          </select>
          <button data-a=vtest>Test</button>
        </div>
        <p class=mut style="margin:8px 0 0">
          Says the score after each visit, who is up, and "you have 44 left" when you are on a finish.
          Voices come from your device, so they differ between browsers.
        </p>
        <details class=mut style="margin-top:6px"><summary>Get a more natural voice</summary>
          <ul style="margin:8px 0 0;padding-left:20px">
            <li>Microsoft Edge (Windows, Mac): its voices marked Online (Natural) are very good, including Australian English ones.</li>
            <li>Mac: System Settings, Accessibility, Spoken Content, System voice, Manage voices. Download an Enhanced or Premium English voice, then reload this page.</li>
            <li>iPhone and iPad: Settings, Accessibility, Spoken Content, Voices, then download an Enhanced or Premium voice.</li>
            <li>Android: Settings, System, Languages, Text-to-speech, then install a higher quality English voice.</li>
          </ul>
        </details>`
          : '<p class=mut>This browser has no speech support.</p>'
  }</div>
  <div class=sec>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <button data-a=exp>Export CSV</button>
      <button data-a=resync>Full resync</button>
      <span class=mut>${visits.length} visits on this device, ${queue.length} waiting to sync</span>
    </div>
  </div>`;

}
