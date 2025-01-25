// ==UserScript==
// @name         Jail Bail Estimator & Easy Bailer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Displays a bail estimate and provides buttons to quickly bail someone out.
// @author       neth [3564828]
// @match        https://www.torn.com/jailview.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_log
// ==/UserScript==

(function() {


    // Bail amounts with 50% job discount, 10% & 5% edu discounts
    // Expected: 15,750,000
    //      Got:  6,896,644
    //
    // Expected: 1,370,000
    //      Got:

    GM_log('STARTING!')

    const discounts = [
        {
            id: 'administrative-law',
            displayName: 'Administrative Law',
            amount: .05,
        },
        {
            id: 'use-of-force',
            displayName: 'Use Of Force In International Law',
            amount: .1,
        },
        {
            id: 'bachelor-law',
            displayName: 'Bachelor Of Law',
            amount: .5,
        },
        {
            id: 'law-firm-job',
            displayName: 'Law Firm Job',
            amount: .5,
        },
    ]

    const defaultSettings = {
        autoScroll: false,
        quickBuy: false,
        minBailEstimate: 0.0,
        maxBailEstimate: 100_000.0,
        apiKey: '',
        discounts: [],
    }

    const bailData = {}

    const storage_key = 'jail_bail_estimator';
    const settings = loadSettings()

    const dollarFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    let scrolled = false

    function loadSettings() {
        return GM_getValue(storage_key, defaultSettings)
    }

    function updateSettings() {
        GM_setValue(storage_key, settings)
    }

    function listMutationCallback(mutationList, observer) {
        mutationList.filter((mutation) => mutation.type === 'childList').forEach(handleListMutation)
    }

    function handleListMutation(mutation) {
        // DEBUG - fix
        GM_log('Mutation!')

        let jailedList = document.querySelectorAll('.user-info-list-wrap > li')
        GM_log('JAILED LIST SIZE: ' + jailedList.length)

        jailedList.forEach((element, index) => {
            const jailedId = element.querySelector('.user.name').getAttribute('href').split('=')[1]

            const timeElement = element.querySelector('.info-wrap .time')
            const timeString = timeElement ? timeElement.textContent.trim() : null
            const minutes = timeToMinutes(timeString).toFixed(0)
            const levelElement = element.querySelector('.info-wrap .level')
            const level = levelElement ? parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim()) : null
            const estimate = calculateEstimate(level, minutes)

            // Store for quick bail functionality
            bailData[jailedId] = estimate

            const reasonElement = element.querySelector('.info-wrap .reason')
            if (!reasonElement.hasAttribute('estimate')) {

                // noinspection CssUnresolvedCustomProperty
                reasonElement.innerHTML += `<br><span style="color: var(--default-green-color);">${formatEstimate(estimate)}</span>`

                reasonElement.setAttribute('estimate', estimate)
            }
        })

        if (settings.autoScroll && !scrolled) {
            scrolled = true
            window.scrollTo({
                top: document.body.scrollHeight,
            });
        }
    }

    function calculateEstimate(level, minutes) {
        let estimate = 100.0 * level * minutes
        for (const discountId in settings.discounts) {
            estimate *= (1.0 - discounts[discountId].amount)
        }
        return estimate
    }

    const timeRegex = /(?:(\d+)h )?(\d+)m/
    function timeToMinutes(timeString) {
        const match = timeString.match(timeRegex)
        if (match) {
            const hours = parseInt(match[1] || '0', 10);
            const minutes = parseInt(match[2], 10);
            return (hours * 60) + minutes;
        }
        return -1
    }

    function formatEstimate(estimate) {
        return dollarFormat.format(estimate)
    }

    function createUiElement() {
        // TODO UI element
        const element = document.createElement('div')
        element.style.display = 'flex'
        element.style.flexDirection = 'row'
        element.style.flexWrap = 'wrap'
        element.style.alignContent = 'normal'
        element.style.justifyContent = 'space-evenly'
        element.style.alignItems = 'normal'
        element.style.width = '100%'
        element.style.padding = '10px'
        return element
    }

    // Observe the list
    const listObserverConfig = { childList: true, subtree: true }
    const listObserver = new MutationObserver(listMutationCallback)
    const listNode = document.querySelector('.user-info-list-wrap');
    listObserver.observe(listNode, listObserverConfig)

    GM_log('ENDED!')

})();