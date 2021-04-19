class MdEmbedIt
{
    constructor() {
        // dependencies
        // scripts
        this.url_js_markdown_it = "https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js";
        this.url_js_hl          = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js";
        this.url_js_mermaid     = "https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.9.2/mermaid.min.js";

        // style sheets
        this.url_css_hl_def   = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css";
        this.url_css_hl_theme = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/vs2015.min.css";
        
        this.init_promise = null;
        this.markdownit = null;
    }

    load_css(url) {
        return new Promise((resolve, reject) => {
            let node = document.createElement('link');
            node.rel = 'stylesheet';
            node.href = url;
            node.onload = () => resolve(node);
            node.onerror = () => reject(new Error('error loading: ' + url)); 
            let head = document.head;
            head.appendChild(node);
        });
    }

    load_script(url) {
        return new Promise((resolve, reject) => {
            let node = document.createElement('script')
            node.src = url;
            node.onload = () => resolve(node);
            node.onerror = () => reject(new Error('error loading: ' + url)); 
            let head = document.head;
            head.appendChild(node);
        });
    }

    init_with_implicit_usage_of_promises() {
        if (this.init_promise)
            return this.init_promise;

        let promise = new Promise((resolve, reject) => {
            this.load_css(this.url_css_hl_def);
            this.load_css(this.url_css_hl_theme);
            resolve(true);
        })
        .then(() => {
            this.load_script(this.url_js_markdown_it);
        })
        .then(() => {
            console.log('markdown loaded.');
            return this.load_script(this.url_js_hl);
        })
        .then(() => {
            console.log('highlight loaded.');
            return this.load_script(this.url_js_mermaid);
        })
        .then(() => {
            console.log('mermaid loaded.');
            let has_mermaid = typeof mermaid !== 'undefined';
            if (has_mermaid) {
                mermaid.initialize({ startOnLoad: false, theme: 'forest' });
            }
            this.markdownit = window.markdownit({
                html: true,
                typographer: false,
                highlight: function (str, lang) {
                    if (lang === "mermaid" && has_mermaid) {
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
                            var res = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
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

        this.init_promise = promise;
        this.initialized = true;
        return this.init_promise;
    }

    async render_tag(markdownId, htmlId) {
        await this.init_with_implicit_usage_of_promises();
        this.do_render(markdownId, htmlId);
    }

    async render_all(className) {
        await this.init_with_implicit_usage_of_promises();
        this.render_by_class(className);
    }

    render_by_class(className) {
        className = className ?? "md-embed-it";
        let allNodes = document.getElementsByClassName(className);
        let nodes = Array.from(allNodes); //m ake a copy because we are going to replace nodes when rendering and they will disappear from the nodes collection in th e middle of the loop
        for (let i = 0; i < nodes.length; i++) {
            let mdNode = nodes[i];
            this.md_to_html(mdNode);
        };
    }

    md_to_html(mdNode, htmlNode) {
        
        if(!this.initialized) {
            this.ensureVisible(mdNode);
            return;
        }

        let html = null;
        try {

            let markup = mdNode.innerText; // use innerText as opposed to innerHTML, because it is de-escaped by HTML parser 
            html = this.markdownit.render(markup);
        } catch (e) {
            html = '<pre>' + e + '</pre>'
        }

        if(htmlNode) {
            htmlNode.innerHTML = html;
            mdNode.remove();
        } else {
            htmlNode = document.createElement('div')
            htmlNode.innerHTML = html;
            mdNode.replaceWith(htmlNode);
        }
    }

    ensureVisible(node) {
        node.style = 'display: block;';
    }

    do_render(markdownId, htmlId) {

        let mdNode = document.getElementById(markdownId); // make sure the element with markdown markup is a <pre> element
        if (!mdNode) return;

        this.md_to_html(mdNode);

        let htmlNode = document.getElementById(htmlId);
        this.md_to_html(mdNode, htmlNode);

    }

    register_on_document_load(contentLoaded) {
        if (typeof document !== 'undefined') {
            window.addEventListener(
                'load',
                function () {
                    contentLoaded();
                },
                false
            );
        }
    }
}