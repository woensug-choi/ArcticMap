## Build with Electron

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Run locally in Dev mode
   
     ```bash
     npm run dev
     ```

3. Build the Next.js static output (writes to `out/` because `output: "export"` is enabled):

	 ```bash
	 npm run build
	 ```

4. Create Electron builds:

	 - Create platform installers:

		 ```bash
		 npm run make
		 ```

    - You will find `/forge-out/make/` folder containing .zip of installers for your platform.