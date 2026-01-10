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
    const report = `# Export de Données: ${name}
Date: ${new Date().toLocaleString()}

## 1. Contexte du Projet
- **ID**: ${project.id}
- **Créé le**: ${date}
- **Source**: ${project.source_file_path ? project.source_file_path.split(/[\\/]/).pop() : 'N/A'}
- **Layout**: ${algorithm || 'Auto'}

## 2. Statistiques
- **Nœuds**: ${nodeCount}
- **Liens**: ${edgeCount}
- **Densité**: ${metadata?.density ? Number(metadata.density).toFixed(4) : "N/A"}

## 3. Liste des Nœuds
Ci-dessous la liste complète des entités du graphe.
${generateMarkdownTable(nodesList, 'node')}

## 4. Liste des Relations (Liens)
Ci-dessous la liste complète des connexions.
${generateMarkdownTable(edgesList, 'edge')}

---
*Généré par GraphXR Studio*
`;

    return report;
}

export function downloadReport(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
