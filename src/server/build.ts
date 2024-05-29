const result = await Bun.build({
    entrypoints: ["./index.ts"],
    outdir: "./dist",
    naming: "[dir]/[name].m[ext]",
    target: "node"
});

console.log(result);