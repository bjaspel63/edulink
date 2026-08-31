
let links = [];
let selectedSubjects = new Set();


/* =========================================
   DOM
========================================= */

const searchInput = document.getElementById("searchInput");
const subjectButton = document.getElementById("subjectButton");
const subjectButtonText = document.getElementById("subjectButtonText");
const subjectMenu = document.getElementById("subjectMenu");
const subjectSearch = document.getElementById("subjectSearch");
const subjectOptions = document.getElementById("subjectOptions");
const clearSubjects = document.getElementById("clearSubjects");
const sortSelect = document.getElementById("sortSelect");
const cardGrid = document.getElementById("cardGrid");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const subjectCount = document.getElementById("subjectCount");
const resultsCount = document.getElementById("resultsCount");
const activeFilters = document.getElementById("activeFilters");


/* =========================================
   LOAD CSV
========================================= */

async function loadCSV() {

    try {

        const response = await fetch("links.csv");

        if (!response.ok) {
            throw new Error("links.csv could not be loaded.");
        }

        const text = await response.text();

        links = parseCSV(text);

        console.log("Loaded websites:", links);

        console.log(
            "Detected subjects:",
            getSubjects()
        );

        initialize();

    } catch (error) {

        console.error("CSV ERROR:", error);

        if (cardGrid) {

            cardGrid.innerHTML = `

                <div
                    style="
                        grid-column:1/-1;
                        background:white;
                        border:1px solid #e1e6ee;
                        border-radius:15px;
                        padding:35px;
                        text-align:center;
                    "
                >

                    <h3>⚠️ Unable to load links.csv</h3>

                    <p
                        style="
                            margin-top:10px;
                            color:#667085;
                        "
                    >
                        Make sure links.csv is in the same
                        folder as index.html.
                    </p>

                    <p
                        style="
                            margin-top:8px;
                            color:#667085;
                            font-size:13px;
                        "
                    >
                        Use a local web server when testing
                        the website.
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

    updateStatistics();

    createSubjectOptions();

    updateSubjectButton();

    updateActiveFilters();

    renderCards();

}


/* =========================================
   CSV PARSER
========================================= */

function parseCSV(text) {

    const rows = [];

    let row = [];
    let cell = "";
    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];


        /* Escaped quote */

        if (
            char === '"' &&
            insideQuotes &&
            next === '"'
        ) {

            cell += '"';

            i++;

        }


        /* Open / close quote */

        else if (char === '"') {

            insideQuotes = !insideQuotes;

        }


        /* Column separator */

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(cell);

            cell = "";

        }


        /* Row separator */

        else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }

            row.push(cell);

            if (
                row.some(
                    value =>
                        value.trim() !== ""
                )
            ) {

                rows.push(row);

            }

            row = [];
            cell = "";

        }


        else {

            cell += char;

        }

    }


    /* Final row */

    if (
        cell.length > 0 ||
        row.length > 0
    ) {

        row.push(cell);

        if (
            row.some(
                value =>
                    value.trim() !== ""
            )
        ) {

            rows.push(row);

        }

    }


    if (rows.length < 2) {

        console.warn("CSV contains no data.");

        return [];

    }


    /* =====================================
       HEADERS
    ===================================== */

    const headers = rows[0].map(header => {

        return header
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase();

    });


    console.log("CSV headers:", headers);


    /* =====================================
       DATA
    ===================================== */

    const data = rows
        .slice(1)
        .map(row => {

            const item = {};

            headers.forEach(
                (header, index) => {

                    item[header] =
                        (row[index] || "").trim();

                }
            );

            return item;

        });


    return data;

}


/* =========================================
   SPLIT SUBJECTS
========================================= */

function splitSubjects(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return [];

    }


    return String(value)
        .split(",")
        .map(subject => subject.trim())
        .filter(subject => subject.length > 0);

}


/* =========================================
   GET ALL SUBJECTS
========================================= */

function getSubjects() {

    const subjectSet = new Set();


    links.forEach(link => {

        const subjects =
            splitSubjects(
                link.applicable_subjects
            );


        subjects.forEach(subject => {

            subjectSet.add(subject);

        });

    });


    return Array.from(subjectSet).sort(
        (a, b) =>
            a.localeCompare(b)
    );

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    if (totalCount) {

        totalCount.textContent =
            links.length;

    }


    if (subjectCount) {

        subjectCount.textContent =
            getSubjects().length;

    }

}


/* =========================================
   CREATE SUBJECT OPTIONS
========================================= */

function createSubjectOptions() {

    const subjects =
        getSubjects();


    subjectOptions.innerHTML = "";


    subjects.forEach(subject => {

        const label =
            document.createElement("label");

        label.className =
            "subject-option";


        const checkbox =
            document.createElement("input");

        checkbox.type =
            "checkbox";

        checkbox.value =
            subject;

        checkbox.checked =
            selectedSubjects.has(subject);


        checkbox.addEventListener(
            "change",
            function () {

                if (this.checked) {

                    selectedSubjects.add(
                        this.value
                    );

                } else {

                    selectedSubjects.delete(
                        this.value
                    );

                }


                updateSubjectButton();

                updateActiveFilters();

                renderCards();

            }
        );


        const text =
            document.createElement("span");

        text.textContent =
            subject;


        label.appendChild(
            checkbox
        );

        label.appendChild(
            text
        );


        subjectOptions.appendChild(
            label
        );

    });

}


/* =========================================
   SUBJECT BUTTON
========================================= */

function updateSubjectButton() {

    if (!subjectButtonText) {
        return;
    }


    const count =
        selectedSubjects.size;


    if (count === 0) {

        subjectButtonText.textContent =
            "Subjects";

    }

    else if (count === 1) {

        subjectButtonText.textContent =
            "1 Subject";

    }

    else {

        subjectButtonText.textContent =
            `${count} Subjects`;

    }

}


/* =========================================
   SUBJECT SEARCH
========================================= */

if (subjectSearch) {

    subjectSearch.addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".subject-option"
                )
                .forEach(option => {

                    const text =
                        option.textContent
                            .toLowerCase();


                    option.style.display =
                        text.includes(query)
                            ? "flex"
                            : "none";

                });

        }
    );

}


/* =========================================
   OPEN SUBJECT MENU
========================================= */

if (subjectButton) {

    subjectButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            subjectMenu.classList.toggle(
                "hidden"
            );


            if (
                !subjectMenu.classList.contains(
                    "hidden"
                )
            ) {

                subjectSearch.focus();

            }

        }
    );

}


/* =========================================
   CLOSE SUBJECT MENU
========================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".subject-dropdown"
            )
        ) {

            subjectMenu.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================
   CLEAR SUBJECTS
========================================= */

if (clearSubjects) {

    clearSubjects.addEventListener(
        "click",
        function () {

            selectedSubjects.clear();


            document
                .querySelectorAll(
                    ".subject-option input"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;

                    }
                );


            updateSubjectButton();

            updateActiveFilters();

            renderCards();

        }
    );

}


/* =========================================
   ACTIVE FILTERS
========================================= */

function updateActiveFilters() {

    if (!activeFilters) {
        return;
    }


    activeFilters.innerHTML = "";


    selectedSubjects.forEach(
        subject => {

            const filter =
                document.createElement("span");

            filter.className =
                "active-filter";

            filter.textContent =
                `✓ ${subject}`;


            activeFilters.appendChild(
                filter
            );

        }
    );

}


/* =========================================
   FILTER LINKS
========================================= */

function getFilteredLinks() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    let filtered =
        links.filter(link => {


            /* SEARCH */

            const searchableText = `

                ${link.name || ""}

                ${link.url || ""}

                ${link.applicable_subjects || ""}

                ${link.description || ""}

                ${link.tags || ""}

            `.toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(
                    search
                );


            /* SUBJECT */

            const linkSubjects =
                splitSubjects(
                    link.applicable_subjects
                );


            /*
                Match ANY selected subject.
            */

            const matchesSubjects =
                selectedSubjects.size === 0 ||
                linkSubjects.some(
                    subject =>
                        selectedSubjects.has(
                            subject
                        )
                );


            return (
                matchesSearch &&
                matchesSubjects
            );

        });


    /* =====================================
       SORT
    ===================================== */

    const sort =
        sortSelect.value;


    if (sort === "name") {

        filtered.sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
        );

    }


    else if (sort === "nameDesc") {

        filtered.sort(
            (a, b) =>
                (b.name || "")
                    .localeCompare(
                        a.name || ""
                    )
        );

    }


    else if (sort === "subject") {

        filtered.sort(
            (a, b) => {

                const aSubject =
                    splitSubjects(
                        a.applicable_subjects
                    )[0] || "";


                const bSubject =
                    splitSubjects(
                        b.applicable_subjects
                    )[0] || "";


                const result =
                    aSubject.localeCompare(
                        bSubject
                    );


                if (result !== 0) {

                    return result;

                }


                return (
                    a.name || ""
                ).localeCompare(
                    b.name || ""
                );

            }
        );

    }


    return filtered;

}


/* =========================================
   RENDER CARDS
========================================= */

function renderCards() {

    const filtered =
        getFilteredLinks();


    cardGrid.innerHTML = "";


    resultsCount.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "website"
                : "websites"
        }`;


    if (filtered.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    filtered.forEach(link => {

        cardGrid.appendChild(
            createCard(link)
        );

    });

}


/* =========================================
   CREATE CARD
========================================= */

function createCard(link) {

    const card =
        document.createElement("article");

    card.className =
        "card";


    /* =====================================
       IMAGE
    ===================================== */

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "card-image";


    if (link.screenshot) {

        const image =
            document.createElement("img");


        image.src =
            link.screenshot;

        image.alt =
            `${link.name} screenshot`;

        image.loading =
            "lazy";


        image.onerror =
            function () {

                this.style.display =
                    "none";


                const placeholder =
                    document.createElement("div");

                placeholder.className =
                    "image-placeholder";

                placeholder.textContent =
                    "🌐";


                imageContainer.appendChild(
                    placeholder
                );

            };


        imageContainer.appendChild(
            image
        );

    }

    else {

        imageContainer.innerHTML = `

            <div class="image-placeholder">
                🌐
            </div>

        `;

    }


    /* =====================================
       SUBJECT BADGES
    ===================================== */

    const badgeContainer =
        document.createElement("div");

    badgeContainer.className =
        "subject-badges";


    const subjects =
        splitSubjects(
            link.applicable_subjects
        );


    subjects.forEach(subject => {

        const badge =
            document.createElement("span");

        badge.className =
            "subject-badge";

        badge.textContent =
            subject;


        badgeContainer.appendChild(
            badge
        );

    });


    imageContainer.appendChild(
        badgeContainer
    );


    /* =====================================
       CARD BODY
    ===================================== */

    const body =
        document.createElement("div");

    body.className =
        "card-body";


    /* TITLE */

    const titleRow =
        document.createElement("div");

    titleRow.className =
        "card-title";


    const title =
        document.createElement("h3");

    title.textContent =
        link.name ||
        "Untitled Website";


    /* OPEN LINK */

    const openLink =
        document.createElement("a");

    openLink.className =
        "open-link";

    openLink.href =
        link.url || "#";

    openLink.target =
        "_blank";

    openLink.rel =
        "noopener noreferrer";

    openLink.textContent =
        "Open ↗";


    titleRow.appendChild(
        title
    );

    titleRow.appendChild(
        openLink
    );


    body.appendChild(
        titleRow
    );


    /* DESCRIPTION */

    const description =
        document.createElement("p");

    description.className =
        "description";

    description.textContent =
        link.description ||
        "No description available.";


    body.appendChild(
        description
    );


    /* TAGS */

    const tagsContainer =
        document.createElement("div");

    tagsContainer.className =
        "tags";


    if (link.tags) {

        link.tags
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
            .forEach(tag => {

                const tagElement =
                    document.createElement("span");

                tagElement.className =
                    "tag";

                tagElement.textContent =
                    `#${tag}`;


                tagsContainer.appendChild(
                    tagElement
                );

            });

    }


    body.appendChild(
        tagsContainer
    );


    /* COMPLETE CARD */

    card.appendChild(
        imageContainer
    );

    card.appendChild(
        body
    );


    return card;

}


/* =========================================
   EVENTS
========================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderCards
    );

}


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        renderCards
    );

}


/* =========================================
   START
========================================= */

loadCSV();
