import fs from "node:fs";
import { Recipe } from "@cooklang/cooklang-ts";
import matter from "gray-matter";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/styles/main.css": "styles/main.css"
  });

  eleventyConfig.addTemplateFormats("cook");

  eleventyConfig.addExtension('cook', {
    getData: function (inputPath) {
      const fileContent = fs.readFileSync(inputPath, 'utf-8');
      const { data: metadata, content } = matter(fileContent);
      const recipe = new Recipe(content)


      return {
        layout: 'recipe.njk',
        metadata,
        ingredients: recipe.ingredients,
        // for each step, add spans and classes
        // to ingredients, timers, and cookware
        steps: recipe.steps.map(step => {
          return `<li>${step.map(s => {
            if (s.type === 'text') {
              return s.value
            } else if (s.type === 'ingredient') {
              return `<span class="cl-ingredient">${s.name.toLowerCase()}</span>`
            } else if (s.type === 'timer') {
              return `<span class="cl-timer">${s.quantity} ${s.units}</span>`
            } else if (s.type === 'cookware') {
              return `<span class="cl-cookware">${s.name.toLowerCase()}</span>`
            }
          }).join('')}</li>`
        }).join('')
      }
    },
    compile: async (inputContent) => {
      return async () => {
        return inputContent
      };
    },
  });

  eleventyConfig.addCollection("recipes", function (collectionApi) {
		return collectionApi.getFilteredByGlob("**/*.cook").sort((a, b) => {
      return a.data.metadata.title - b.data.metadata.title;
    });
	});
};

export const config = {
  dir: {
    layouts: "src/layouts",
    output: "dist",
  }
};