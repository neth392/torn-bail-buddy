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
        collapsed: false,
        autoScroll: false,
        quickBuy: false,
        minBailEstimate: 0.0,
        maxBailEstimate: 100_000.0,
        apiKey: '',
        discounts: [],
    }

    const bailData = {}

    const storage_key = 'jail_bail_estimator'
    const settings = loadSettings()

    const dollarFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    })

    let scrolled = false

    function loadSettings() {
        return GM_getValue(storage_key, defaultSettings)
    }

    function saveSettings() {
        GM_setValue(storage_key, settings)
    }

    function listMutationCallback(mutationList, observer) {
        mutationList.filter((mutation) => mutation.type === 'childList').forEach(handleListMutation)
    }

    function handleListMutation(mutation) {
        // Select the list of jailed users
        let jailedUserList = document.querySelectorAll('.user-info-list-wrap > li')

        // Iterate the list of jailed users
        jailedUserList.forEach((element, index) => {

            const userData = extractUserData(element)

            // Store for quick bail functionality
            bailData[userData.id] = userData

            // Modify the reason element if not already done
            const reasonElement = element.querySelector('.info-wrap .reason')
            if (!reasonElement.hasAttribute('estimate')) {
                modifyReasonElementWithEstimate(reasonElement, userData.estimate)
            }
        })

        if (settings.autoScroll && !scrolled) {
            scrolled = true
            window.scrollTo({
                top: document.body.scrollHeight,
            })
        }
    }

    function extractUserData(element) {
        const id = element.querySelector('.user.name').getAttribute('href').split('=')[1]

        const timeElement = element.querySelector('.info-wrap .time')
        const timeString = timeElement ? timeElement.textContent.trim() : null
        const minutes = timeToMinutes(timeString).toFixed(0)
        const levelElement = element.querySelector('.info-wrap .level')
        const level = levelElement ? parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim()) : null
        return {
            id: id,
            minutes: minutes,
            level: level,
            estimate: calculateEstimate(level, minutes),
        }
    }

    function modifyReasonElementWithEstimate(reasonElement, estimate) {
        // noinspection CssUnresolvedCustomProperty
        reasonElement.innerHTML += `<br><span style='color: var(--default-green-color)'>${formatEstimate(estimate)}</span>`

        reasonElement.setAttribute('estimate', estimate)
    }

    function calculateEstimate(level, minutes) {
        let estimate = 100.0 * level * minutes

        let discountMultiplier = 1.0
        for (const discountId in settings.discounts) {
            discountMultiplier *= 1.0 - discounts[discountId].amount
        }

        return estimate * discountMultiplier
    }

    const timeRegex = /(?:(\d+)h )?(\d+)m/
    function timeToMinutes(timeString) {
        const match = timeString.match(timeRegex)
        if (match) {
            const hours = parseInt(match[1] || '0', 10)
            const minutes = parseInt(match[2], 10)
            return (hours * 60) + minutes
        }
        return -1
    }

    function formatEstimate(estimate) {
        return dollarFormat.format(estimate)
    }

    function isAPIKeyValid(apiKey) {
        //TODO
    }

    function validateAPIKey(apiKey) {
        if (!isAPIKeyValid(apiKey)){
            //TODO api key not valid
        }

        // TODO
    }


    function createUIElement() {
        // Create the main container
        const container = document.createElement('div')
        container.style.width = '100%'
        container.style.color = 'var(--default-color, #333)'

        // Create a collapsible toggle button
        const toggleButton = document.createElement('button')
        toggleButton.textContent = '▼ Bail Estimator'
        toggleButton.style.display = 'block'
        toggleButton.style.width = '100%'
        toggleButton.style.borderRadius = '5px 5px 0px 0px'
        toggleButton.style.padding = '5px 0px 5px 5px'
        toggleButton.style.color = 'var(--tutorial-title-color)'
        toggleButton.style.textShadow = 'var(--tutorial-title-shadow)'
        toggleButton.style.cursor = 'pointer'
        toggleButton.style.textAlign = 'left'
        toggleButton.style.fontWeight = 'bold'
        toggleButton.style.backgroundClip = 'border-box'
        toggleButton.style.backgroundOrigin = 'border-box'
        toggleButton.style.backgroundImage = 'var(--default-panel-gradient)'

        // Hover effect
        toggleButton.addEventListener('mouseover', () => {
            toggleButton.style.backgroundImage = 'var(--default-panel-active-gradient)'
        })

        toggleButton.addEventListener('mouseout', () => {
            toggleButton.style.backgroundImage = 'var(--default-panel-gradient)'
        })

        toggleButton.addEventListener('mousedown', () => {
            toggleButton.style.backgroundImage = 'var(--default-panel-active-gradient)'
        })

        toggleButton.addEventListener('mouseup', () => {
            toggleButton.style.backgroundImage = 'var(--default-panel-gradient)'
        })


        // Create the content container
        const content = document.createElement('div')
        content.style.backgroundColor = 'var(--default-bg-panel-color)'
        content.style.borderRadius = '0px 0px 5px 5px'

        const updateContent = () => {
            content.style.display = settings.collapsed ? 'none' : 'block'
            toggleButton.textContent = settings.collapsed ? '► Bail Estimator' : '▼ Bail Estimator'
            toggleButton.style.borderRadius = settings.collapsed ? '5px' : '5px 5px 0px 0px'
        }

        updateContent()

        // Collapsible functionality
        toggleButton.addEventListener('click', () => {
            settings.collapsed = !settings.collapsed
            saveSettings()
            updateContent()
        })

        container.appendChild(toggleButton)

        const divider = document.createElement('div')
        divider.style.borderBottomStyle = 'solid'
        divider.style.borderBottomWidth = '1px'
        divider.style.borderBottomColor = 'var(--title-divider-bottom-color)'
        divider.style.borderTopStyle = 'solid'
        divider.style.borderTopWidth = '1px'
        divider.style.borderTopColor = 'var(--title-divider-top-color)'
        content.appendChild(divider)

        const apiKeyContainer = document.createElement('div')
        apiKeyContainer.style.padding = '5px 0px 5px 5px'

        // Create the label for the API key field
        const apiKeyLabel = document.createElement('apiKeyLabel')
        apiKeyLabel.style.padding = '5px, '
        apiKeyLabel.textContent = 'API Key'
        apiKeyLabel.style.fontSize = '14px'
        apiKeyLabel.style.display = 'inline-block'
        apiKeyContainer.appendChild(apiKeyLabel)

        // Create the question mark icon
        const questionMark = document.createElement('span')
        questionMark.textContent = '?'
        questionMark.style.padding = '1px'
        questionMark.style.border = '1px solid var(--input-border-color, #ccc)'
        questionMark.style.borderRadius = '50%'
        questionMark.style.cursor = 'pointer'
        questionMark.style.display = 'inline-block'
        questionMark.style.textAlign = 'center'
        questionMark.style.width = '14px'
        questionMark.style.height = '14px'
        questionMark.style.verticalAlign = 'middle'
        questionMark.style.lineHeight = '14px'
        questionMark.style.marginLeft = '4px'
        questionMark.style.backgroundColor = 'var(--input-background-color, #fff)'

        // Tooltip functionality
        const tooltip = document.createElement('div')
        tooltip.textContent = 'Optionally use a limited access key to update the below fields, re-click validate to update them whenever.'
        tooltip.style.position = 'absolute'
        tooltip.style.textWrap = 'balance'
        tooltip.style.maxWidth = '25%'
        tooltip.style.borderRadius = '4px'
        tooltip.style.padding = '5px'
        tooltip.style.fontSize = '14px'
        tooltip.style.backgroundColor = 'var(--default-bg-panel-color)'
        tooltip.style.color = 'var(--default-color)'
        tooltip.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
        tooltip.style.display = 'none'
        tooltip.style.boxSizing = 'border-box'
        tooltip.style.zIndex = '10'

        // Hover effect
        questionMark.addEventListener('mouseover', () => {
            tooltip.style.display = 'block'
        })
        questionMark.addEventListener('mouseout', () => {
            tooltip.style.display = 'none'
        })
        questionMark.addEventListener('click', () => {
            tooltip.style.display = tooltip.style.display === 'none' ? 'block' : 'none'
        })

        // Append the tooltip and question mark
        apiKeyContainer.appendChild(questionMark)
        apiKeyContainer.appendChild(tooltip)

        content.appendChild(apiKeyContainer)

        // Create the input field for the API key
        const input = document.createElement('input')
        input.type = 'text'
        input.id = 'apiKeyInput'
        input.placeholder = 'Enter your API key'
        input.style.width = '25%'
        input.style.padding = '2px'
        input.style.backgroundColor = 'var(--input-background-color, #fff)'
        input.style.border = '1px solid var(--input-border-color, #ccc)'
        input.style.borderRadius = '2px'
        input.style.display = 'inline-block'
        input.style.marginLeft = '5px'
        apiKeyContainer.appendChild(input)

        // Create the validate button
        const validateButton = document.createElement('button')
        validateButton.textContent = 'Validate'
        validateButton.style.padding = '2px'
        validateButton.style.border = 'none'
        validateButton.style.borderRadius = '4px'
        validateButton.style.marginLeft = '5px'
        validateButton.style.backgroundColor = 'var(--default-blue-color)'
        validateButton.style.color = '#fff'
        validateButton.style.cursor = 'pointer'
        validateButton.style.display = 'inline-block'
        apiKeyContainer.appendChild(validateButton)

        // Position the tooltip
        questionMark.addEventListener('mousemove', (e) => {
            tooltip.style.top = `${e.clientY + 15}px`
            tooltip.style.left = `${e.clientX + 15}px`
        })

        // Append the content container to the main container
        container.appendChild(content)

        return container
    }

    function addUIElement(userListWrapperElement, uiElement) {
        const tornToolsElement = document.getElementById('#jailFilter')
        // If torn tools is installed add the UI element after that one
        if (tornToolsElement != null) {
            GM_log('torn tools found!')
            tornToolsElement.insertAdjacentElement('afterend', uiElement)
        }
        // Otherwise add it as the first child element
        else{
            GM_log('torn tools not found!')
            userListWrapperElement.insertBefore(uiElement, userListWrapperElement.firstChild)
        }
    }

    // Handle the UI element
    const uiElement = createUIElement()
    addUIElement(document.querySelector('.userlist-wrapper'), uiElement)

    // Observe the list
    const listObserverConfig = { childList: true, subtree: true }
    const listObserver = new MutationObserver(listMutationCallback)
    const listNode = document.querySelector('.user-info-list-wrap')
    listObserver.observe(listNode, listObserverConfig)

    GM_log('ENDED!')

})()