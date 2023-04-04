// GitHub uses Primer (https://primer.style/css/) as its design system

import ReactDOM from 'react-dom';
import React, { useEffect } from 'react';
import GitUrlParse from 'git-url-parse';

import { useState } from 'react';

import { Button, Box, Text, Popover, Heading, ThemeProvider, TextInput } from '@primer/components';
import { CopyIcon, ZapIcon } from '@primer/octicons-react';

import { AVAILABLE_APPS, generateRegularUrl } from './generator';
import { getPref, setPref } from './prefs';


function buildUrl(contName, app) {
    const parts = GitUrlParse(window.location.href);
    const repoUrl = `${parts.protocol}://${parts.source}/${parts.full_name}`;
    return generateRegularUrl(contName, repoUrl, parts.ref, app, parts.name + '/' + parts.filepath);
}
function copyGeneratedUrl(contName, app) {
    navigator.clipboard.writeText(buildUrl(contName, app));
}

function openGeneratedUrl(contName, app) {
    window.open(buildUrl(contName, app));
}

function Form() {
    const [contName, setcontName] = useState(getPref('cont-name', ''));
    const [app, setApp] = useState(getPref('app', 'classic'));
    const [isValidcontName, setIsValidcontName] = useState(false);
    const [finishedCopying, setFinishedCopying] = useState(false);

    useEffect(() => {
        try {
            // TODO: Use potentially new API end-point to
            //  validate container name against list of available

            //new URL(contName);
            // contName is a valid URL
            setIsValidcontName(true);
        } catch (_) {
            setIsValidcontName(false);
        }
    }, [contName]);

    useEffect(() => {
        setPref('cont-name', contName);
    }, [contName]);

    useEffect(() => {
        setPref('app', app);
    }, [app])

    return <Box display="flex" flexDirection="column">
        <Heading sx={{ fontSize: 2, mb: 1 }}>Container Name</Heading>

        <TextInput value={contName} onChange={(ev) => setcontName(ev.target.value)} placeholder="jupyter" aria-label="Container Name" />
        <Text color="danger.fg" sx={{ visibility: isValidcontName ? "hidden" : "visible" }}>Enter a container name</Text>

        <Heading sx={{ fontSize: 2, mb: 1, mt: 2 }}>Open in</Heading>
        <select className="form-select mb-1" onChange={(ev) => setApp(ev.target.value)} value={app}>
            {Object.entries(AVAILABLE_APPS).map(([name, value]) => {
                return <option key={name} value={name}>{value.title}</option>
            })};
        </select>

        <Button disabled={!isValidcontName || finishedCopying} sx={{ mt: 2 }} onClick={() => {
            copyGeneratedUrl(contName, app);
            // Flash a 'Copied!' message for 3 seconds after copying
            setFinishedCopying(true);
            setTimeout(() => setFinishedCopying(false), 3 * 1000)
        }}>
            <CopyIcon /> {finishedCopying ? "Copied!" : "Copy NCShare link"}
        </Button>
        <Button disabled={!isValidcontName || finishedCopying} sx={{ mt: 2 }} onClick={() => {
             openGeneratedUrl(contName, app); 
        }}>
            <ZapIcon /> Open NCShare link
        </Button>

    </Box>
}

function NBGitPullerButton() {
    const [open, setOpen] = React.useState(false)

    // Using <details> here with details-overlay gives us behavior of closing the popover when clikced outside
    const b = <details className="details-overlay details-reset">
        <summary className="btn mr-2" onClick={() => setOpen(!open)}>
            NCShare <span className="dropdown-caret"></span>
        </summary>


        <Popover open={open} caret="top-left">
            <Popover.Content sx={{ mt: 2, width: 320 }} className="color-shadow-large">
                <Form />
            </Popover.Content>
        </Popover>
    </details>;
    return b;
}

/**
 * When you navigate between files and folders in GitHub, the navigation is done
 * client side - so the onload events aren't fired again. This means our code to
 * add the button isn't run. Ideally, we'll find some way to hook into this, and
 * setup the button again after each file nav. Unfortunately, no such event seems
 * to exist, at least not directly in content scripts. popstate is only for human
 * interaction (like pressing the back button), and monkeypatching pushState seems
 * sketchy and doesn't actually work. Possibly something with a background script
 * is needed.
 *
 * In the meantime, instead, I just run a check every goddamn second. This is
 * absolutely horrible, but it'll help me ship. And I need to talk to my therapist
 * about not being able to really ship, so I think this is the right thing to do.
 */
function implementUgliestHackEverAt0430AMToKeepTheButtonFromDisappearingOnNav() {
    setInterval(() => {
        if (document.hidden) {
            // We're not in the foreground, nobody cares
            return;
        }

        if (document.getElementById('ncshare-link-generator')) {
            return;
        }

        setup();
        // Dear lord in heaven, please forgive me.
    }, 1 * 1000)
}

function setup() {
    if (document.getElementById('ncshare-link-generator')) {
        console.log('ncshare-link-generator already setup');
        return;
    }
    // Add 'nbgitpuller' dropdown button
    const root = document.createElement('div');
    root.id = 'ncshare-link-generator';

    if (document.querySelector('.file-navigation > div.d-flex')) {
        // On a particular directory, insert this as first button, before 'Go to file'
        document.querySelector('.file-navigation > div.d-flex').prepend(root);
    } else if (document.getElementById('blob-path')) {
        // On a particular file, insert it after the name of the file
        document.getElementById('blob-path').insertAdjacentElement('afterend', root)
    } else if (document.querySelector('.file-navigation > div.flex-auto')) {
        // On root page of repo, insert this as first button, before 'Go To File'
        document.querySelector('.file-navigation > div.flex-auto').insertAdjacentElement('afterend', root);
    } else {
        // Looks like we're not on a page with content
        return;
    }
    ReactDOM.render(
        <ThemeProvider>
            <NBGitPullerButton />
        </ThemeProvider>,
        root
    );


}

setup();
implementUgliestHackEverAt0430AMToKeepTheButtonFromDisappearingOnNav();