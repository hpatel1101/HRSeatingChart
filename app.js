const searchInput = document.getElementById("guestSearch");
const clearButton = document.getElementById("clearSearch");
const suggestions = document.getElementById("suggestions");
const searchHint = document.getElementById("searchHint");
const result = document.getElementById("result");

const normalize = (value) =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const displayTable = (table) => (/^\d+$/.test(table) ? `Table ${table}` : table);

const searchIndex = SEATING_DATA.flatMap((tableGroup, tableIndex) =>
  tableGroup.guests.map((name, guestIndex) => ({
    name,
    normalizedName: normalize(name),
    table: tableGroup.table,
    tableIndex,
    guestIndex,
  }))
);

let activeSuggestion = -1;
let visibleSuggestions = [];

function scoreMatch(entry, query) {
  if (entry.normalizedName === query) return 0;
  if (entry.normalizedName.startsWith(query)) return 1;

  const words = entry.normalizedName.split(" ");
  if (words.some((word) => word.startsWith(query))) return 2;
  if (entry.normalizedName.includes(query)) return 3;

  const tokens = query.split(" ").filter(Boolean);
  if (tokens.every((token) => entry.normalizedName.includes(token))) return 4;
  return 99;
}

function findMatches(rawQuery, limit = 20) {
  const query = normalize(rawQuery);
  if (!query) return [];

  return searchIndex
    .map((entry) => ({ entry, score: scoreMatch(entry, query) }))
    .filter(({ score }) => score < 99)
    .sort((a, b) =>
      a.score - b.score ||
      a.entry.name.localeCompare(b.entry.name) ||
      Number(a.entry.table.replace(/\D/g, "")) - Number(b.entry.table.replace(/\D/g, ""))
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
}

function setHint(message) {
  searchHint.textContent = message;
}

function closeSuggestions() {
  suggestions.classList.remove("open");
  suggestions.innerHTML = "";
  searchInput.setAttribute("aria-expanded", "false");
  activeSuggestion = -1;
  visibleSuggestions = [];
}

function renderSuggestions(matches) {
  visibleSuggestions = matches.slice(0, 8);
  activeSuggestion = -1;

  if (!visibleSuggestions.length) {
    closeSuggestions();
    return;
  }

  suggestions.innerHTML = visibleSuggestions
    .map(
      (match, index) => `
        <button class="suggestion" type="button" role="option" data-index="${index}">
          <span class="suggestion-name">${escapeHtml(match.name)}</span>
          <span class="suggestion-table">${escapeHtml(displayTable(match.table))}</span>
        </button>
      `
    )
    .join("");

  suggestions.classList.add("open");
  searchInput.setAttribute("aria-expanded", "true");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function renderGuest(entry) {
  const group = SEATING_DATA[entry.tableIndex];
  const mates = group.guests;

  result.innerHTML = `
    <article class="result-card">
      <div class="result-top">
        <p class="welcome">Your seat is ready</p>
        <h2 class="guest-name">${escapeHtml(entry.name)}</h2>
        <div class="table-pill">${escapeHtml(displayTable(entry.table))}</div>
      </div>
      <div class="table-mates">
        <h3>Seated at your table</h3>
        <ul class="guest-list">
          ${mates
            .map(
              (name, index) =>
                `<li class="${index === entry.guestIndex ? "selected" : ""}">${escapeHtml(name)}</li>`
            )
            .join("")}
        </ul>
      </div>
    </article>
  `;

  searchInput.value = entry.name;
  clearButton.classList.add("visible");
  setHint(`${displayTable(entry.table)} · ${mates.length} guests listed`);
  closeSuggestions();

  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderMultiple(matches) {
  result.innerHTML = `
    <div class="multi-card">
      <h2 class="multi-title">We found more than one match</h2>
      <p class="multi-copy">Choose the table that matches the guest you’re looking for.</p>
      <div class="match-grid">
        ${matches
          .map(
            (match, index) => `
              <button type="button" class="match-button" data-match-index="${index}">
                <strong>${escapeHtml(match.name)}</strong>
                <span>${escapeHtml(displayTable(match.table))}</span>
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  [...result.querySelectorAll("[data-match-index]")].forEach((button) => {
    button.addEventListener("click", () => {
      renderGuest(matches[Number(button.dataset.matchIndex)]);
    });
  });
}

function renderNotFound() {
  result.innerHTML = `
    <div class="empty-card">
      <h2 class="empty-title">Name not found</h2>
      <p class="empty-copy">Try searching just your first name, last name, or a different spelling.</p>
    </div>
  `;
}

function selectBestMatch() {
  const matches = findMatches(searchInput.value, 50);
  const query = normalize(searchInput.value);

  if (!query) return;

  const exactMatches = matches.filter((match) => match.normalizedName === query);

  if (exactMatches.length === 1) {
    renderGuest(exactMatches[0]);
  } else if (exactMatches.length > 1) {
    closeSuggestions();
    renderMultiple(exactMatches);
    setHint(`${exactMatches.length} guests have that exact name.`);
  } else if (matches.length === 1) {
    renderGuest(matches[0]);
  } else if (matches.length > 1) {
    closeSuggestions();
    renderMultiple(matches.slice(0, 10));
    setHint("Choose the correct guest from the matches below.");
  } else {
    closeSuggestions();
    renderNotFound();
    setHint("No matching name found.");
  }
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.trim();
  clearButton.classList.toggle("visible", Boolean(value));
  result.innerHTML = "";

  if (!value) {
    closeSuggestions();
    setHint("Start typing to search the guest list.");
    return;
  }

  const matches = findMatches(value, 20);
  renderSuggestions(matches);

  if (matches.length) {
    setHint(`${matches.length >= 20 ? "20+" : matches.length} matching guest${matches.length === 1 ? "" : "s"}`);
  } else {
    setHint("No matches yet — try a different spelling.");
  }
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" && visibleSuggestions.length) {
    event.preventDefault();
    activeSuggestion = Math.min(activeSuggestion + 1, visibleSuggestions.length - 1);
  } else if (event.key === "ArrowUp" && visibleSuggestions.length) {
    event.preventDefault();
    activeSuggestion = Math.max(activeSuggestion - 1, 0);
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (activeSuggestion >= 0 && visibleSuggestions[activeSuggestion]) {
      renderGuest(visibleSuggestions[activeSuggestion]);
      return;
    }
    selectBestMatch();
    return;
  } else if (event.key === "Escape") {
    closeSuggestions();
    return;
  } else {
    return;
  }

  [...suggestions.querySelectorAll(".suggestion")].forEach((button, index) => {
    button.classList.toggle("active", index === activeSuggestion);
    if (index === activeSuggestion) button.scrollIntoView({ block: "nearest" });
  });
});

suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  const match = visibleSuggestions[Number(button.dataset.index)];
  if (match) renderGuest(match);
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  result.innerHTML = "";
  clearButton.classList.remove("visible");
  closeSuggestions();
  setHint("Start typing to search the guest list.");
  searchInput.focus();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#searchWrap")) closeSuggestions();
});
