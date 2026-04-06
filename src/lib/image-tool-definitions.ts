// OpenAI-compatible tool definitions for the image generation tools.
// Passed to ChangeAgent via the `tools` parameter — never injected into the system prompt.
// Only used when the bot has image_tools_enabled = true in the bots table.

export const IMAGE_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "generate_image",
      description:
        "Generate a new image from a text prompt. Use when the user asks to create, make, or generate an image. Automatically resolves dimensions from platform and publication_type if provided.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "Detailed text description of the image to generate. Be specific about composition, style, colors, and content.",
          },
          aspect_ratio: {
            type: "string",
            enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
            description: "Aspect ratio for the generated image. Ignored if platform and publication_type are provided.",
          },
          platform: {
            type: "string",
            enum: [
              "Instagram",
              "Facebook",
              "Twitter",
              "X",
              "LinkedIn",
              "Flyer",
              "Poster",
            ],
            description: "Target social media platform or print format.",
          },
          publication_type: {
            type: "string",
            enum: [
              "Story",
              "Post",
              "Feed",
              "Reel",
              "Cover",
              "Profile",
              "Event",
              "Header",
              "Letter",
              "A4",
              "Half",
              "18x24",
              "24x36",
              "11x17",
            ],
            description: "Type of publication for the target platform.",
          },
          with_branding: {
            type: "boolean",
            description:
              "Whether to apply organisation branding to the generated image. Default false.",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_image",
      description:
        "Edit an existing image using AI with text instructions. Use when the user wants to modify, change, or update an image that already exists in the conversation.",
      parameters: {
        type: "object",
        properties: {
          instructions: {
            type: "string",
            description:
              "Text instructions describing how to edit the image. Be specific about what to change.",
          },
          image_url: {
            type: "string",
            description: "URL of the image to edit.",
          },
          aspect_ratio: {
            type: "string",
            enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
            description: "Optional new aspect ratio for the edited image.",
          },
        },
        required: ["instructions", "image_url"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fuse_images",
      description:
        "Combine two images into one using AI. Use when the user wants to merge, combine, or blend two images together.",
      parameters: {
        type: "object",
        properties: {
          instructions: {
            type: "string",
            description:
              "Optional text instructions describing how to combine the images.",
          },
          image_url_1: {
            type: "string",
            description: "URL of the first image.",
          },
          image_url_2: {
            type: "string",
            description: "URL of the second image.",
          },
          aspect_ratio: {
            type: "string",
            enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
            description: "Aspect ratio for the combined image.",
          },
          use_style_reference: {
            type: "boolean",
            description:
              "Whether to use the first image as a style reference instead of merging directly. Default false.",
          },
        },
        required: ["image_url_1", "image_url_2"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "apply_branding",
      description:
        "Apply organisation branding to an image. Use when the user asks to brand, style, or apply the organisation's visual identity to an image.",
      parameters: {
        type: "object",
        properties: {
          image_url: {
            type: "string",
            description: "URL of the image to apply branding to.",
          },
          branding_style: {
            type: "string",
            description:
              "Optional description of the branding style to apply.",
          },
          aspect_ratio: {
            type: "string",
            enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"],
            description: "Optional new aspect ratio after branding.",
          },
        },
        required: ["image_url"],
      },
    },
  },
] as const;
