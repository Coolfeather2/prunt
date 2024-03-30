// ==UserScript==
// @name         PrUn Tool - KAWA Importer
// @version      2024-03-30.02
// @description  Import KAWA prices into PRUNplanner
// @author       Coolfeather2
// @match        https://prunplanner.org/cx
// @match        https://prunplanner.org/cx/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/Coolfeather2/prunt/tampermonkey/kawa.js
// @updateURL    https://raw.githubusercontent.com/Coolfeather2/prunt/tampermonkey/kawa.js
// ==/UserScript==

function createButton() {
  const button = document.createElement("button");
  button.innerHTML = "Import KAWA";
  button.className =
    "items-center cursor-pointer inline-flex overflow-hidden relative select-none text-center align-bottom transition duration-200 ease-in-out focus:outline-none focus:outline-offset-0 focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(157,193,251,1),0_1px_2px_0_rgba(0,0,0,1)] focus:shadow-[0_0_0_2px_rgba(28,33,39,1),0_0_0_4px_rgba(147,197,253,0.7),0_1px_2px_0_rgba(0,0,0,0)] text-white dark:text-gray-900 dark:bg-blue-400 bg-blue-500 dark:bg-blue-400 border border-blue-500 dark:border-blue-400 hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-500 dark:hover:border-blue-500 rounded-md text-xs py-1 px-2";
  button.onclick = async function () {
    this.appendChild(spinner());
    console.log('Child appended')
    const allData = await fetchAllPages('https://kawapi.dizzy.zone/api/collections/kawa_pricing/records');
    console.log(allData);

    //filter array for items that planet is Proxion
    //loop over data, fill form with data, wait for previous to complete before next
    const filteredData = allData.filter((data) => data.planet === "Proxion");
    for (let i = 0; i < filteredData.length; i++) {
        await new Promise((resolve) => {
            setTimeout(() => {
                fillForm(filteredData[i]);
                resolve();
            }, 500);
        });
    }
    
   

    console.log('Child removed')
    this.removeChild(this.lastChild);
  };

  const flexDiv = document.createElement("div");
  flexDiv.className = "flex px-3 mt-3";
  flexDiv.appendChild(button);

  return flexDiv;
}


function fillForm(data) {
    console.log(`Filling form with data: ${JSON.stringify(data)}`);
    // Fetch title element
    const title = get_title("Empire Material");
    if (!title) {
        console.log("No Empire Material found");
        return;
    }

    // Fetch card element
    const card = find_price_card(title);
    if (!card) {
        console.log("No card found");
        return;
    }

    // Fetch input elements
    const [text_input, price_input, button] = find_price_elements(card);
    if (!text_input || !price_input || !button) {
        console.log("Not all elements found");
        return;
    }    
    //set text_input to data.ticker and price_input to data.price, while triggering event listeners
    text_input.value = data.ticker;
    text_input.dispatchEvent(new Event('input', { bubbles: true }));
    //input price and trigger a focus loss event
    price_input.value = data.price;
    price_input.dispatchEvent(new Event('input', { bubbles: true }));
    price_input.dispatchEvent(new Event('blur', { bubbles: true }));
    //wait 1 second and click the button
    button.click();
}

function get_title(name) {
    let titles = document.querySelectorAll('[data-pc-section="title"]');
    let value = undefined;
    titles.forEach((element) => {
        if (element.innerHTML === name) {
            value = element;
        }
    });
    return value;
}

function find_price_card(title) {
    return title.parentElement.nextElementSibling.children[0];
}

function find_price_elements(card) {
    let text_input = card.children[0];
    let count_input = card.children[1].children[0];
    let button = card.children[3];
    return [text_input, count_input, button];
}


async function fetchAllPages(url, page = 1, perPage = 400) {
    console.log(`Fetching page ${page}`);
    const response = await fetch(`${url}?page=${page}&perPage=${perPage}`);
    const data = await response.json();
    console.log(`Fetched ${data.items.length} items`);

    if (page >= data.totalPages) {
        // If the current page is greater than or equal to totalPages, we've reached the last page
        console.log('Reached the last page');
        return data.items;
    } else {
        // Otherwise, fetch the next page and combine the results
        console.log('Fetching the next page');
        const nextPageData = await fetchAllPages(url, page + 1, perPage);
        return data.items.concat(nextPageData);
    }
}

function spinner() {
  const spinner = document.createElement("div");
  spinner.innerHTML = `
  <svg class="mx-2 animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0012 20c4.411 0 8-3.589 8-8h-2c0 3.309-2.691 6-6 6V17z"></path>
  </svg>
  `;
  return spinner;
}

(function runScript() {
  "use strict";

  const div = document.querySelector("#main");
  div.parentNode.insertBefore(createButton(), div);
})();
