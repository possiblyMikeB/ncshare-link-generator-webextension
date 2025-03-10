function generateRegularUrl(contName, repoUrl, branch, app, filepath) {

    if(!contName) {
        contName = "jupyter";
    }

    let url = new URL('https://cmgr.ncshare.org');
    url.pathname += `incommon_login/containers/${contName}`;

    let arg_url = new URL('https://dummy');
    arg_url.pathname += 'git-pull';
    arg_url.searchParams.set('repo', repoUrl);

    if (branch) {
        arg_url.searchParams.set('branch', branch);
    }

    if (!arg_url.pathname.endsWith('/')) {
        arg_url.pathname += '/';
    }
   	arg_url.searchParams.set('urlpath', AVAILABLE_APPS[app].generateUrlPath(filepath));

    let redir_value = encodeURIComponent(arg_url.pathname + encodeURIComponent(arg_url.search));
    url.pathname += `%3Fredirect=${redir_value}`;
    return url.toString();
}

const AVAILABLE_APPS = {
    classic: {
        title: 'Classic Notebook',
        generateUrlPath: function (path) { return 'tree/' + path; },
    },
    retrolab: {
        title: 'RetroLab',
        generateUrlPath: function (path) { return 'retro/tree/' + path; },
    },
    jupyterlab: {
        title: 'JupyterLab',
        generateUrlPath: function (path) { return 'lab/tree/' + path; }
    },
    shiny: {
        title: 'Shiny',
        generateUrlPath: function (path) {
            // jupyter-shiny-proxy requires everything to end with a trailing slash
            if (!path.endsWith("/")) {
                path = path + "/";
            }
            return 'shiny/' + path;
        }
    },
    rstudio: {
        title: 'RStudio',
        generateUrlPath: function (path) { return 'rstudio/'; }
    }
}

export {AVAILABLE_APPS, generateRegularUrl}