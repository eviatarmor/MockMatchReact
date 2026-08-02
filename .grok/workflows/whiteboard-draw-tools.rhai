let meta = #{
    name: "whiteboard-draw-tools",
    description: "Expand @mockmatch/whiteboard drawing: pen, highlighter, smart draw, erasers, lasso, color/thickness — parallel implement then verify",
    phases: [
        #{ title: "Implement", detail: "parallel model, UI, canvas, host" },
        #{ title: "Verify", detail: "static review of key files" },
    ],
    when_to_use: "When extending whiteboard pen/highlighter/eraser/lasso tools",
};

let check_schema = #{
    "type": "object",
    "required": ["ok", "summary", "gaps"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "gaps": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 12 },
    },
};

phase("Implement");
log("Fan-out: parallel agents verify/implement draw tool slices under packages/whiteboard");

let jobs = [
    #{
        label: "model-geometry",
        capability_mode: "read-write",
        output_schema: check_schema,
        prompt: "Repo MockMatch. Focus packages/whiteboard. Ensure types/document support pen, highlighter, smart draw paths (strokeKind, opacity), erasers, lassoSelectIds. Files: types.ts, document.ts, lib/geometry.ts, lib/erase.ts. Read those files. If missing pieces, implement. Report ok/summary/gaps. Do not edit client.",
    },
    #{
        label: "tool-ui",
        capability_mode: "read-write",
        output_schema: check_schema,
        prompt: "Repo MockMatch packages/whiteboard. Ensure tool-rail.tsx lists select, pan, pen, highlighter, smart, eraser, precisionEraser, lasso, sticky, text, shape, connector with hotkeys. Ensure draw-style-bar.tsx provides color + thickness. Wire exports in index.ts. Read and fix if broken. Report ok/summary/gaps.",
    },
    #{
        label: "canvas-tools",
        capability_mode: "read-write",
        output_schema: check_schema,
        prompt: "Repo MockMatch packages/whiteboard/src/canvas. Ensure whiteboard-canvas.tsx implements pen, highlighter, smart draw (classify stroke to line/rect/ellipse), whole eraser, precision eraser, lasso multi-select, penStyle/highlighterStyle props. elements.tsx path opacity for highlighter. Read and fix bugs. Report ok/summary/gaps.",
    },
    #{
        label: "host-i18n",
        capability_mode: "read-write",
        output_schema: check_schema,
        prompt: "Repo MockMatch client simulation-whiteboard. Ensure page wires draw styles, all tool labels, WhiteboardDrawStyleBar when stroke tools active, hotkeys including shift+e precision. Locales en-US/en-GB/en-AU simulation-whiteboard.json tools + drawStyle. Read and fix. Report ok/summary/gaps.",
    },
];

let results = parallel(jobs);
let gaps = [];
let ok_count = 0;
for r in results {
    if r == () || !r.success {
        gaps.push("agent failed or empty");
    } else {
        if r.output.ok == true { ok_count += 1; }
        if r.output.gaps != () {
            for g in r.output.gaps { gaps.push(g); }
        }
    }
}
log("Implement slices done: " + ok_count.to_string() + " ok; gaps=" + gaps.len().to_string());

phase("Verify");
let verify = agent(
    "Read packages/whiteboard/src/types.ts, tool-rail.tsx, draw-style-bar.tsx, canvas/whiteboard-canvas.tsx, client/src/features/simulation-whiteboard/simulation-whiteboard-page.tsx. Confirm all tools exist and style bar is wired. List remaining gaps only if real. Use read_file/grep only.",
    #{ label: "verify-draw-tools", capability_mode: "read-only", output_schema: check_schema }
);

let summary = "whiteboard draw tools workflow complete";
if verify != () && verify.success && verify.output.summary != () {
    summary = verify.output.summary;
}
complete(#{
    summary: summary,
    implement_ok: ok_count,
    gaps: gaps,
});
