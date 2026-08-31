

/* =========================================
   GLOBAL DATA
========================================= */

let links = [];


/* =========================================
   DOM ELEMENTS
========================================= */

const searchInput =
    document.getElementById("searchInput");

const subjectFilter =
    document.getElementById("subjectFilter");

const sortSelect =
    document.getElementById("sortSelect");

const cardGrid =
    document.getElementById("cardGrid");

const emptyState =
    document.getElementById("emptyState");

const subjectPills =
    document.getElementById("subjectPills");

const totalCount =
    document.getElementById("totalCount");

const subjectCount =
    document.getElementById("subjectCount");

const resultsCount =
    document.getElementById("resultsCount");


/* =========================================
   LOAD CSV
========================================= */

async function loadCSV() {

    try {

        const response =
            await fetch("links.csv");

        if (!response.ok) {

            throw new Error(
                "Could not load links.csv"
            );

        }

        const text =
            await response.text();

        links =
            parseCSV(text);

        initialize();

    } catch (error) {

        console.error(error);

        cardGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                background:white;
                border:1px solid #e1e6ee;
                border-radius:15px;
                padding:30px;
                text-align:center;
            ">

                <h3>
                    ⚠️ Unable to load links.csv
                </h3>

                <p style="
                    margin-top:10px;
                    color:#667085;
                ">
                    Make sure links.csv is in the
                    same folder as index.html.
                </p>

                <p style="
                    margin-top:8px;
                    color:#667085;
                    font-size:13px;
                ">
                    If you opened index.html directly,
                    use a local web server instead.
                </p>

            </div>
        `;

    }

}


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

    updateStatistics();

    createSubjectFilter();

    createSubjectPills();

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


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];

        const next =
            text[i + 1];


        /* Double quotation inside quoted text */

        if (
            char === '"' &&
            insideQuotes &&
            next === '"'
        ) {

            cell += '"';

            i++;

        }


        /* Start/end quotation */

        else if (
            char === '"'
        ) {

            insideQuotes =
                !insideQuotes;

        }


        /* Column separator */

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(cell);

            cell = "";

        }


        /* New row */

        else if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }

            row.push(cell);

            rows.push(row);

            row = [];

            cell = "";

        }


        else {

            cell += char;

        }

    }


    /* Last cell */

    if (
        cell.length > 0 ||
        row.length > 0
    ) {

        row.push(cell);

        rows.push(row);

    }


    if (rows.length < 2) {

        return [];

    }


    /* First row = headers */

    const headers =
        rows[0].map(
            header =>
                header
                    .trim()
                    .toLowerCase()
        );


    /* Convert rows to objects */

    return rows
        .slice(1)
        .filter(row =>
            row.some(
                value =>
                    value.trim() !== ""
            )
        )
        .map(row => {

            const object = {};

            headers.forEach(
                (header, index) => {

                    object[header] =
                        (row[index] || "")
                            .trim();

                }
            );

            return object;

        });

}


/* =========================================
   GET SUBJECTS
========================================= */

function getSubjects() {

    return [

        ...new Set(

            links

                .map(
                    link =>
                        link.subject
                            ?.trim()
                )

                .filter(Boolean)

        )

    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const subjects =
        getSubjects();


    totalCount.textContent =
        links.length;


    subjectCount.textContent =
        subjects.length;

}


/* =========================================
   SUBJECT FILTER
========================================= */

function createSubjectFilter() {

    const subjects =
        getSubjects();


    subjectFilter.innerHTML = `

        <option value="">
            All Subjects
        </option>

        ${
            subjects
                .map(subject => `
                    <option
                        value="${escapeHTML(subject)}"
                    >
                        ${escapeHTML(subject)}
                    </option>
                `)
                .join("")
        }

    `;

}


/* =========================================
   SUBJECT PILLS
========================================= */

function createSubjectPills() {

    const subjects =
        getSubjects();


    subjectPills.innerHTML = `

        <button
            class="pill active"
            data-subject=""
        >
            All
        </button>

        ${
            subjects
                .map(subject => `

                    <button
                        class="pill"
                        data-subject="${escapeAttribute(subject)}"
                    >
                        ${escapeHTML(subject)}
                    </button>

                `)
                .join("")
        }

    `;


    document
        .querySelectorAll(".pill")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const subject =
                        this.dataset.subject;


                    subjectFilter.value =
                        subject;


                    updateActivePill(
                        subject
                    );


                    renderCards();

                }
            );

        });

}


/* =========================================
   ACTIVE PILL
========================================= */

function updateActivePill(subject) {

    document
        .querySelectorAll(".pill")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.subject === subject
            );

        });

}


/* =========================================
   FILTER DATA
========================================= */

function getFilteredLinks() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const subject =
        subjectFilter.value;


    let filtered =
        links.filter(link => {

            const searchableText = `

                ${link.name || ""}

                ${link.subject || ""}

                ${link.description || ""}

                ${link.tags || ""}

                ${link.url || ""}

            `.toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(
                    search
                );


            const matchesSubject =
                !subject ||
                link.subject === subject;


            return (
                matchesSearch &&
                matchesSubject
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
                a.name.localeCompare(
                    b.name
                )
        );

    }


    else if (
        sort === "nameDesc"
    ) {

        filtered.sort(
            (a, b) =>
                b.name.localeCompare(
                    a.name
                )
        );

    }


    else if (
        sort === "subject"
    ) {

        filtered.sort(
            (a, b) => {

                const subjectCompare =
                    a.subject.localeCompare(
                        b.subject
                    );


                if (
                    subjectCompare !== 0
                ) {

                    return subjectCompare;

                }


                return a.name.localeCompare(
                    b.name
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
       SCREENSHOT
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
                    document.createElement(
                        "div"
                    );


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
       SUBJECT BADGE
    ===================================== */

    const badge =
        document.createElement("span");


    badge.className =
        "subject-badge";


    badge.textContent =
        link.subject ||
        "Uncategorized";


    imageContainer.appendChild(
        badge
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


    /* =====================================
       DESCRIPTION
    ===================================== */

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


    /* =====================================
       TAGS
    ===================================== */

    const tagsContainer =
        document.createElement("div");


    tagsContainer.className =
        "tags";


    if (link.tags) {

        const tags =
            link.tags
                .split(",")
                .map(
                    tag =>
                        tag.trim()
                )
                .filter(Boolean);


        tags.forEach(tag => {

            const tagElement =
                document.createElement(
                    "span"
                );


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


    /* =====================================
       COMPLETE CARD
    ===================================== */

    card.appendChild(
        imageContainer
    );


    card.appendChild(
        body
    );


    return card;

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value || "")
        .replace(
            /[&<>"']/g,
            character => {

                const entities = {

                    "&": "&amp;",

                    "<": "&lt;",

                    ">": "&gt;",

                    '"': "&quot;",

                    "'": "&#039;"

                };


                return entities[
                    character
                ];

            }
        );

}


/* =========================================
   ESCAPE ATTRIBUTE
========================================= */

function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================
   EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    renderCards
);


subjectFilter.addEventListener(
    "change",
    function () {

        updateActivePill(
            this.value
        );

        renderCards();

    }
);


sortSelect.addEventListener(
    "change",
    renderCards
);


/* =========================================
   START APPLICATION
========================================= */

loadCSV();