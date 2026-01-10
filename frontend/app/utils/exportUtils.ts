// Helper to escape pipe characters in markdown tables
const escapeMd = (txt: any) => {
    if (txt === null || txt === undefined) return "";
    if (typeof txt === 'object') return JSON.stringify(txt).replace(/\|/g, "\\|");
    return String(txt).replace(/\|/g, "\\|");
};

function generateMarkdownTable(items: any[], type: 'node' | 'edge'): string {
    if (!items || items.length === 0) return "*Aucune donnée*";

    // 1. Determine columns (union of all keys)
    // Exclude technical/visual keys for "human readable" focus
    const ignoredKeys = new Set(['index', 'fx', 'fy', 'fz', 'vx', 'vy', 'vz', '__indexColor', 'x', 'y', 'z', 'color']);
    if (type === 'edge') {
        ignoredKeys.add('source'); // Handle separately
        ignoredKeys.add('target'); // Handle separately
    }

    const allKeys = new Set<string>();
    items.forEach(item => {
        Object.keys(item).forEach(k => {
            if (!ignoredKeys.has(k)) allKeys.add(k);
        });
    });

    const columns = Array.from(allKeys).sort();

    // Header
    let md = "|";
    if (type === 'edge') md += " Source | Target |";
    columns.forEach(c => md += ` ${c} |`);
    md += "\n|";
    if (type === 'edge') md += " :--- | :--- |";
    columns.forEach(() => md += " :--- |");
    md += "\n";

    // Rows
    items.forEach(item => {
        md += "|";
        if (type === 'edge') {
            md += ` ${escapeMd(item.source)} | ${escapeMd(item.target)} |`;
        }
        columns.forEach(c => {
            md += ` ${escapeMd(item[c])} |`;
        });
        md += "\n";
    });

    return md;
}

export function generateProjectReport(project: any): string {
    const { name, metadata, graph_data, mapping, created_at, algorithm } = project;
    const date = new Date(created_at).toLocaleDateString();

    // Support both 'edges' and 'links' typical from different parsers/libs
    const edgesList = graph_data?.edges || graph_data?.links || [];
    const nodesList = graph_data?.nodes || [];

    const nodeCount = nodesList.length;
    const edgeCount = edgesList.length;

    // --- Format Report ---
    const report = `# Rapport de Projet: ${name}
Date: ${new Date().toLocaleString()}

---

## 1. Métadonnées et Contexte
| Propriété | Valeur |
| :--- | :--- |
| **ID** | \`${project.id}\` |
| **Création** | ${date} |
| **Fichier Source** | ${project.source_file_path ? project.source_file_path.split(/[\\/]/).pop() : 'N/A'} |
| **Layout** | ${algorithm || 'Auto'} |
| **Densité** | ${metadata?.density ? Number(metadata.density).toFixed(4) : "N/A"} |

---

## 2. Statistiques du Graphe
- **Nombre de Nœuds**: ${nodeCount}
- **Nombre de Liens**: ${edgeCount}

---

## 3. Données des Nœuds
*Liste complète des entités et leurs attributs.*

${generateMarkdownTable(nodesList, 'node')}

---

## 4. Données des Relations
*Liste des connexions entre les entités.*

${generateMarkdownTable(edgesList, 'edge')}

---
*Généré par GraphXR Studio*
`;

    return report;
}

export function generateJSONExport(project: any): string {
    const exportData = {
        metadata: {
            id: project.id,
            name: project.name,
            created_at: project.created_at,
            updated_at: project.updated_at,
            source_file: project.source_file_path,
            algorithm: project.algorithm,
            stats: project.metadata
        },
        settings: {
            mapping: project.mapping,
            filters: project.viewState?.filters,
            layout: project.viewState?.layoutAlgorithm,
            labels: project.viewState?.labelsVisible,
            camera: project.viewState?.camera
        },
        graph: {
            nodes: project.graph_data?.nodes || [],
            edges: project.graph_data?.edges || project.graph_data?.links || []
        }
    };
    return JSON.stringify(exportData, null, 2);
}

export function generateCSVExport(items: any[]): string {
    if (!items || items.length === 0) return "";

    // Get headers
    const headers = Object.keys(items[0]).join(",");

    // Get rows
    const rows = items.map(item => {
        return Object.values(item).map(val => {
            if (val === null || val === undefined) return "";
            const str = String(val);
            // Escape quotes and wrap in quotes if contains comma
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(",");
    });

    return [headers, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, type: 'md' | 'json' | 'csv') {
    let mimeType = 'text/plain;charset=utf-8';
    if (type === 'json') mimeType = 'application/json';
    if (type === 'csv') mimeType = 'text/csv;charset=utf-8';
    if (type === 'md') mimeType = 'text/markdown;charset=utf-8';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
