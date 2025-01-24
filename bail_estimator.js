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
    GM_log('STARTING!')
    const storage_key = 'jail_bail_estimator';
    const settings = GM_getValue(storage_key, { min_bail: 0.0, max_bail: Number.MAX_VALUE})

    function listMutationCallback(mutationList, observer) {
        mutationList.filter((mutation) => mutation.type === 'childList').forEach(handleListMutation)
    }

    function handleListMutation(mutation) {
        // DEBUG - fix
        GM_log('Mutation!')

        let jailedList = document.querySelectorAll('.user-info-list-wrap > li')
        GM_log('JAILED LIST SIZE: ' + jailedList.length)

        jailedList.forEach((element, index) => {
            const timeElement = element.querySelector('.info-wrap .time')
            const timeString = timeElement ? timeElement.textContent.trim() : null
            const minutes = timeToMinutes(timeString).toFixed(0)
            const levelElement = element.querySelector('.info-wrap .level')
            const level = levelElement ? parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim()) : null
            const estimate = calculateEstimate(level, minutes, settings)

            if (element.querySelector('.estimate')) {
                return
            }
            const bustElement = element.querySelector('.bust.t-gray-3')
            const estimateElement = document.createElement('span')
            estimateElement.classList.add('estimate', 't-gray-3', 'bye')
            estimateElement.textContent = String(estimate)
            estimateElement.style.display = 'inline-block'
            estimateElement.style.textAlign = 'center'
            estimateElement.style.color = '#00cc00'
            bustElement.style.position = 'relative'
            element.appendChild(estimateElement)
        })
    }

    function calculateEstimate(level, minutes, settings) {
        // TODO extra calculations
        return 100.0 * level * minutes
    }

    const timeRegex = /(\d+)h (\d+)m/
    function timeToMinutes(timeString) {
        const match = timeString.match(timeRegex)
        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            return (hours * 60) + minutes;
        }
        return -1
    }

    function updateEstimateElement(estimateElement, estimate) {
        estimateElement.textContent = String(estimate)
    }

    // Observe the list
    const listObserverConfig = { childList: true, subtree: true }
    const listObserver = new MutationObserver(listMutationCallback)
    const listNode = document.querySelector('.user-info-list-wrap');
    listObserver.observe(listNode, listObserverConfig)

    GM_log('ENDED!')

})();