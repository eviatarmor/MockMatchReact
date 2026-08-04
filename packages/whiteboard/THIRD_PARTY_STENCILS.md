# Third-party stencil attributions

Shape libraries under `src/stencils/generated/` are converted from
[draw.io / diagrams.net](https://github.com/jgraph/drawio) stencil XML
(`src/main/webapp/stencils` in the draw.io source tree).

Review this file before shipping or redistributing the stencil assets.
This is an engineering checklist, not legal advice.

## Primary source

| Item | Detail |
|------|--------|
| Project | draw.io (diagrams.net) |
| Upstream | https://github.com/jgraph/drawio |
| Stencil path | `src/main/webapp/stencils/**/*.xml` |
| Conversion | mxGraph shape XML → SVG (MockMatch script `scripts/convert-stencils.mjs`) |
| Use in product | Software assets inside `@mockmatch/whiteboard` (non-Atlassian) |

## draw.io / jgraph terms (as of draw.io 31.x)

### Application source code

- Licensed under **Apache License 2.0** (see upstream `LICENSE`).
- Apache 2.0 requires preserving copyright and license notices for the
  licensed work you redistribute.

### Icon sets, stencil libraries, and diagram templates

Upstream README and `stencils/LICENSE` state (paraphrased from the
project’s published terms):

1. Icon sets / stencil libraries **and derivatives** (including
   **conversions to other formats**, traced reproductions, substantially
   similar visuals, or AI trained on these icons) **may not** be used as
   software assets in, distributed for use with, or incorporated into
   **Atlassian products** or products distributed through the
   **Atlassian Marketplace / plugin ecosystem**, without explicit written
   permission from the rights holders.
2. That Atlassian restriction **does not** apply to **end-user diagram
   output** (exported images or documents created with the software).
3. Some icons originate from **third-party copyright holders**; draw.io
   states they verified original licenses permit use **in the draw.io
   project**. That does not automatically re-license every brand mark
   for every product use case (see vendor sections below).
4. draw.io makes **no copyright claim** on diagrams **you create** with
   their software.
5. **Trademark:** “draw.io” is a registered trademark. Do **not** use
   the draw.io name or logos in ways that suggest affiliation,
   endorsement, or sponsorship.

Older project documentation and maintainer comments also referred to
**CC BY 4.0** for jgraph-provided icons when the **icon set is hosted /
delivered inside another application**. Current README text emphasizes
the Atlassian carve-out; **attribution remains good practice** when
shipping the libraries inside MockMatch.

### Attribution we should keep

Include (in this file and, when useful, in product “About / licenses” UI):

> Shape libraries derived from draw.io / diagrams.net stencil sets
> (https://github.com/jgraph/drawio). Converted to SVG for MockMatch.
> Not affiliated with draw.io. Stencils and derivatives must not be
> redistributed for use in Atlassian products or the Atlassian Marketplace
> without permission. Brand icons remain property of their respective owners.

## Brand / vendor icon packs (separate from draw.io)

These libraries may include marks governed by the **vendor’s own**
trademark and architecture-icon guidelines. Typical intended use is
**architecture / system diagrams**, not product branding or implying
partnership.

| Library folders (source) | Likely rights holders / notes |
|--------------------------|-------------------------------|
| `aws/`, `aws2/`, `aws3.xml`, `aws3d.xml`, `aws4.xml` | Amazon Web Services — review AWS trademark / architecture icon terms |
| `azure.xml`, `mscae/` | Microsoft Azure / Microsoft architecture icons — architecture diagrams use often permitted under MS icon terms |
| `gcp/`, `gcp2.xml`, `gcp3.xml` | Google Cloud — review Google / GCP brand and icon guidelines |
| `alibaba_cloud.xml` | Alibaba Cloud |
| `ibm.xml`, `ibm_cloud.xml` | IBM |
| `cisco/`, `cisco19.xml`, `cisco_safe/` | Cisco |
| `citrix.xml`, `citrix2.xml` | Citrix |
| `salesforce.xml` | Salesforce |
| `veeam/` | Veeam |
| `openstack.xml` | OpenStack |
| `atlassian.xml` | Atlassian (extra care: Atlassian marks + draw.io Atlassian redistribution ban) |
| `office/` | Microsoft Office / related concepts |
| `weblogos.xml`, `webicons.xml` | Mixed third-party product marks — treat as brand-sensitive |
| `rack/` (apc, cisco, dell, f5, hp, hpe_aruba, ibm, oracle, …) | Hardware vendors |
| `android/`, `ios7/`, `gmdl.xml` | Google / Apple UI motif style icons — brand-sensitive |
| `vvd.xml` | VMware-related (verify current naming / rights) |

**Action later:** walk each brand pack against the vendor’s public icon
license page and record a go / no-go / “diagrams only” note in the table
above.

## Non-brand / generic libraries

Still derived from draw.io stencil distribution (same derivative rules +
attribution). Often lower trademark risk than cloud logos, but still
not public domain by default.

| Source | Examples |
|--------|----------|
| `basic.xml` | Stars, callouts, basic symbols |
| `flowchart.xml` | Flowchart process shapes |
| `arrows.xml` | Arrow variants |
| `bpmn.xml` | BPMN-style shapes |
| `eip.xml` | Enterprise integration patterns |
| `electrical/` | Circuit / logic symbols |
| `floorplan.xml` | Floor-plan furniture / walls |
| `fluid_power.xml` | Fluid power symbols |
| `lean_mapping.xml` | Lean mapping |
| `mockup/` | UI mockup widgets |
| `networks.xml`, `networks2.xml` | Network gear (generic + branded mix) |
| `pid/` | P&ID process symbols |
| `signs/` | Pictogram-style signs |
| `sitemap.xml` | Sitemap nodes |
| `cabinets.xml`, `clipart/` | Misc |
| `bootstrap.xml` | Bootstrap-related UI motifs |
| `kubernetes.xml` (if present in tree) | CNCF / k8s marks — brand-sensitive if present |

## What MockMatch ships

| Artifact | Location |
|----------|----------|
| Converted SVGs (per library JSON) | `src/stencils/generated/categories/*.json` |
| Catalog index (search metadata) | `src/stencils/generated/index.json` |
| Converter | `scripts/convert-stencils.mjs` |
| This notice | `THIRD_PARTY_STENCILS.md` |

Documents on the board embed a copy of the SVG used at placement time so
saved boards stay self-contained.

## Recommended product practices

1. Keep this file in the package and update when re-running conversion
   from a new draw.io version.
2. Add a short licenses blurb in app settings / docs when stencils ship
   to production users.
3. Do **not** brand MockMatch with AWS/Azure/GCP/Cisco/etc. logos.
4. Do **not** claim “draw.io official” or affiliation.
5. Do **not** package these assets for Atlassian Marketplace apps.
6. Prefer “architecture diagram” framing in user-facing copy.
7. Later pass: per-library compliance table (vendor URL + status).

## Re-convert from upstream

```bash
# from packages/whiteboard
node scripts/convert-stencils.mjs --src "C:/path/to/drawio/src/main/webapp/stencils"
```

Record the draw.io version used in the converter log / commit message.

## Version note

Attributions drafted against **draw.io 31.1.5** stencil tree. Re-read
upstream `README` and `stencils/LICENSE` when upgrading the source drop.
