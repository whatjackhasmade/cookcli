#!/bin/bash

# Get the current directory
current_dir="$(pwd)"

# Loop through all the directories in the current directory
for dir in "$current_dir"/*/; do
  # Check if it's a directory
  if [ -d "$dir" ] && [ "$(basename "$dir")" != "config" ]; then
    # Extract the last part of the directory path (after the last /)
    dir_name=$(basename "$dir")
    echo "$dir_name"

    # List only .cook files inside the directory, without recursion
    for file in "$dir"*.cook; do
      if [ -f "$file" ]; then
        echo "  $(basename "$file")"
      fi
    done
  fi
done
