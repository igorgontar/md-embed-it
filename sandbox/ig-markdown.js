// dependencies
// scripts
// const g_url_js_markdown_it = "https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js";
// const g_url_js_hl          = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/highlight.min.js";
// const g_url_js_mermaid     = "https://unpkg.com/mermaid/dist/mermaid.min.js";
// // style sheets
// const g_url_css_hl_def   = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/styles/default.min.css";
// const g_url_css_hl_theme = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/styles/vs2015.min.css";

// scripts
const g_url_js_markdown_it = "https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js";
const g_url_js_hl          = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js";
const g_url_js_mermaid     = "https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.9.2/mermaid.min.js";

// style sheets
const g_url_css_hl_def   = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css";
const g_url_css_hl_theme = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/vs2015.min.css";


const g_url_css_markdown = "ig-markdown.css";

function ig_load_css(url) {
    return new Promise((resolve, reject) => {
        let node = document.createElement('link');
        //node.type = 'text/css';
        node.rel = 'stylesheet';
        node.href = url;
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error('error loading: ' + url)); 
        let head = document.head;
        head.appendChild(node);
    });
}

function ig_load_script(url) {
    return new Promise((resolve, reject) => {
        let node = document.createElement('script')
        node.src = url;
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error('error loading: ' + url)); 
        let head = document.head;
        head.appendChild(node);
    });
}

let g_ig_markdown_initializer = null;
let g_ig_markdownit = null;

function ig_markdown_init() {
    if(g_ig_markdown_initializer)
        return g_ig_markdown_initializer;

    let promise = new Promise((resolve, reject) => {
        ig_load_css(g_url_css_hl_def);
        ig_load_css(g_url_css_hl_theme);
        ig_load_css(g_url_css_markdown);
        resolve(true);
    })
    .then(() => { 
        ig_load_script(g_url_js_markdown_it);
    })    
    .then(() => {
        console.log('markdown loaded.');
        return ig_load_script(g_url_js_hl);
    })
    .then(() => {
        console.log('highlight loaded.');
        return ig_load_script(g_url_js_mermaid);
    })
    .then(() => {
        console.log('mermaid loaded.');
        let has_mermaid = typeof mermaid !== 'undefined';
        if(has_mermaid) {
            mermaid.initialize({startOnLoad: false, theme: 'forest' });
        }
        g_ig_markdownit = window.markdownit({
            html:      true,
            typographer:  false,
            highlight: function (str, lang) {
                if(lang === "mermaid" && has_mermaid) {
                    // do not escape mermaid text, it's parser won't work if '>' sign is translated to &gt;
                    //return '<div class="mermaid">' + str + '</div>';
                    //return str;
                    try {
                        let svg = mermaid.mermaidAPI.render("id-mermaid-temp", str); 
                        return svg;
                    } catch (e) {
                        console.log('mermaid', e); 
                        return '<pre>' + str + '\n<span style="color:red">mermaid diagram parser error:\n' + e + '</span></pre>';
                    }
                }
                else if (lang && hljs.getLanguage(lang)) {
                    try {
                        var res = hljs.highlight(str, {language: lang, ignoreIllegals: true }).value;
                        // the res value is returned as already escaped 
                        return '<pre class="hljs"><code>' + res + '</code></pre>';
                    } catch (e) { console.log('highlight', e); }
                }
                //return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
                return ''; // default escaping, it's the same as above, but shorter
            }
        });
        //if(has_mermaid)
        //    mermaid.init({noteMargin: 4}, ".language-mermaid");
    })
    .catch((e) => {
        console.log('initialization failed.', e);
    })
    g_ig_markdown_initializer = promise;   
    return g_ig_markdown_initializer;
}

function ig_markdown_render(markdownId, htmlId) {
    return ig_markdown_init()
    .then(() => {
        ig_do_render(markdownId, htmlId);
    });
}

function ig_markdown_render_all(className) {
    return ig_markdown_init()
    .then(() => {
        ig_do_render_by_class(className);
    });
}
 
function ig_do_render_by_class(className) {
    className = className ?? "md-embed-it"; 
    let allNodes = document.getElementsByClassName(className); 
    let nodes = Array.from(allNodes);
    for(let i=0; i<nodes.length; i++) {
        let mdNode = nodes[i];
        let html = null;
        try {
            let markup = mdNode.innerText; // use innerText as opposed to innerHTML, because it is de-escaped by HTML parser 
            html = g_ig_markdownit.render(markup);
        } catch (e) {
            html = '<pre>' + e + '</pre>'
        }
    
        htmlNode = document.createElement('div')
        htmlNode.innerHTML = html;
        mdNode.replaceWith(htmlNode);
    };
}

function ig_do_render(markdownId, htmlId) {
    let mdNode = document.getElementById(markdownId); // make sure the element with markdown markup is a <pre> element
    if(!mdNode) return;

    let html = null;
    try {
        let markup = mdNode.innerText; // use innerText as opposed to innerHTML, because it is de-escaped by HTML parser 
        html = g_ig_markdownit.render(markup);
    } catch (e) {
        html = '<pre>' + e + '</pre>'
    }

    let htmlNode = document.getElementById(htmlId);
    if(htmlNode) {
         htmlNode.innerHTML = html;
         mdNode.remove();
    } else {    
        htmlNode = document.createElement('div')
        htmlNode.innerHTML = html;
        mdNode.replaceWith(htmlNode);
    }

}
