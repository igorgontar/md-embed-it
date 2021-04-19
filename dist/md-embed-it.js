class MdEmbedIt
{

    constructor(config = {renderOnLoad: true, loadDeps: true}) {
        // dependencies
        // scripts
        // this.url_js_markdown_it = "https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js";
        // this.url_js_hl          = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/highlight.min.js";
        // this.url_js_mermaid     = "https://unpkg.com/mermaid/dist/mermaid.min.js";
        // // style sheets
        // this.url_css_hl_def   = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/styles/default.min.css";
        // this.url_css_hl_theme = "https://unpkg.com/@highlightjs/cdn-assets@10.7.1/styles/vs2015.min.css";

        /* 
        <link  href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css" rel="stylesheet" /> 
        <link  href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/vs2015.min.css" rel="stylesheet" /> 
        <script src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.9.2/mermaid.min.js"></script> 
        */

        // scripts
        this.url_js_markdown_it = "https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.0.4/markdown-it.min.js";
        this.url_js_hl          = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js";
        this.url_js_mermaid     = "https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.9.2/mermaid.min.js";
        // style sheets
        this.url_css_hl_def   = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css";
        this.url_css_hl_theme = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/vs2015.min.css";
        
        this.markdownit = null;
        this.mermaid = null;
        this.initialized = false;

        this.config = config;
        
        if(this.config.renderOnLoad) {
            this.register_on_document_load(() => this.render_all());
        }
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

    async init() {
        if (this.initialized)
            return;

        try
        {
            if(this.config.loadDeps) {
                this.load_css(this.url_css_hl_def);
                this.load_css(this.url_css_hl_theme);

                await this.load_script(this.url_js_markdown_it);
                console.log('markdown loaded.');
                
                await this.load_script(this.url_js_hl);
                console.log('highlight loaded.');
                
                await this.load_script(this.url_js_mermaid);
                console.log('mermaid loaded.');
            } 

            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ startOnLoad: false, theme: 'forest' });
                this.mermaid = mermaid;
            }
            
            this.markdownit = window.markdownit({
                html: true,
                typographer: false,
                highlight: (str, lang) => this.do_highlite(str, lang),
            });

            this.initialized = true;

        } catch(e) {
            console.error('initialization failed.', e);
            
            if(!this.config.loadDeps ) {
                console.error('loading of dependent libraries is disabled in config, please load markdown-it, highlights and mermaid scipts and css, for example using script and link tags in the thml header section.');
            }
        }
    }

    do_highlite(str, lang) {
    
        if (lang === "mermaid" && this.mermaid) {
            // do not escape mermaid text, it's parser won't work if '>' sign is translated to &gt;
            //return '<div class="mermaid">' + str + '</div>';
            //return str;
            try {
                let svg = this.mermaid.mermaidAPI.render("id-mermaid-temp", str);
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
            } catch (e) { 
                console.log('highlight', e); 
            }
        }
        //return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        return ''; // default escaping, it's the same as above, but shorter
    }

    async render_tag(markdownId, htmlId) {
        await this.init();
        
        let mdNode = document.getElementById(markdownId); // make sure the element with markdown markup is a <pre> element
        if (!mdNode) return;

        let htmlNode = document.getElementById(htmlId);
        this.md_to_html(mdNode, htmlNode);
    }

    async render_file(markdownId, htmlId, fileUrl) {
        await this.init();
        
        let mdNode = document.getElementById(markdownId); // make sure the element with markdown markup is a <pre> element
        if (!mdNode) return;

        let htmlNode = document.getElementById(htmlId);
        this.md_to_html(mdNode, htmlNode, fileUrl);
    }

    async render_all(className) {
        await this.init();
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

    async get_md_text_from_node(mdNode, fileUrl) {
        
        let md = null;
        let url = null;
        if(!url)
            url = fileUrl;
        if(!url)
            url = mdNode.dataset?.url;
        
        if(url) {
            let res = await fetch(url);
            md = await res.text();
        } else {       
            md = mdNode.innerText; // use innerText as opposed to innerHTML, because it is de-escaped by HTML parser
        }
        return md; 
    }

    async md_to_html(mdNode, htmlNode, fileUrl) {
        if(mdNode.nodeName != 'PRE')
            return; // avoid double-rendering
        
        if(!this.initialized) {
            this.ensureVisible(mdNode);
            return;
        }

        let html = null;
        try {

            let markup = await this.get_md_text_from_node(mdNode, fileUrl); 
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
        //node.style = 'visibility: visible;';
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