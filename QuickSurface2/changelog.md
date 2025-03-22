### 23.12.13 : 0.0.3
- Tool class with tool list dynamically generated
- Project class with files list moved to the menu bar
- zoomable and pannable editor moved to this project from JSvWASM_perfTests
- can open images by drag and dropping them from file explorer and open them in a new project
- added unsaved icon for file-items

### 23.12.14 : 0.0.4
- fixed bug with weird jumping when panning when changing current project and then coming back
- opened files from drag and drop now include the file name
- fixed img elements to be not draggable
- added ability to close files that are open and then the next left file will be selected and if no more are left the center pane is left empty
- saved property on projects that removes the white dot when saved
- added ability to Save As an d Open png,jpg,jpeg files with the FileSystemAccessAPI and through legacy methods that browsers don't support
- added dropdown support with sub dropdowns (clickable and hoverable) which can show a list of labels with onclick listeners
- curTool and selectTool
- converted format to use list of frames and list of layers
- added support for resizable panes
- started adding Panel system starting with TimelinePanel
- started TimelinePanel

### 23.12.15 : 0.0.5
- *****many things check github
- mostly the whole timeline panel
    - frames and layers support
    - selecting
    - key bings q and w to move back and forth
    - dot or no dot for whether you've drawn there or not (needs extra check with correction system probably)
    - background layers that span the whole thing and get applied to the whole thing
    - pressing backspace/delete will clear the layer and the dot
- other bug fixes
    - saved icon being correct when new file, opening file, dropping in file
- fixed order in timeline panel

### 23.12.16 : 0.0.6
- needs to get done:
    - spannable layers: select 1 layer then hold alt and click one to the right somewhere of that and that first layer will span until that point acting like it's static because if you make any changes along that line it will effect all the others since it's just the same layer
        - to do this probably make a field on Layer that is "spannedBy:Layer"
        - there will have to be a method somewhere that gets fired when "layout" changes are made to the timeline panel because this would have to be recalculated if it was moved around
    - fix main and other frame layers to be on Project instead of Frame so that they can be arranged/layered correctly and to improve performance when drawing on multiple layers at the same time
----------
- #2 universal main with correct layering when drawing - done
- #1 spannable layers done
- some other stuff probably

- fixed bug where drawing near the right or bottom edge would be antialiased on the edge pixels
- many more things including undo-redo for drawing, historyPanel, fullStateHist, ...

### 23.12.17 : 0.0.7
- added hist support for deleting layers
- added support to paste into layer from clipboard (needs cleaning up though)
- added support to copy from layer into clipboard (both methods don't work with multiple layers)

### 23.12.18 : 0.0.8
- added layer span support to history system
- fixed layout so when center area overflows it doesn't push the page down
- this resulted in bottomPanel being fixed when trying to resize vertically by almost the whole page
- fixed drawing so it doesn't happen when resizing

### 24.4.7 : 0.0.9
- experimented with THREEJS render (wasn't fast enough)
- experimented with multi threaded aliasing correction but I don't have it quite correct yet and it's glitchy
- fixed history system to improve performance if there's a lot of empty frames/layers
- added quickUndo support for HistActions

### 24.4.8 : 0.1.0
- fixed up dropdown to make it look better
- added offy option to dropdowns
- drew line tool icon
- started adding line tool (no preview yet, or for pencil tool yet)
- added selecting to change tools
- fixed circle correction formula to make the circle shape much more accurate
- [idea] - when I add tool ops for the tool settings bar when there's things like brush size, have a plus button to the left that let's you pick custom vars you've set to reuse here
- fixed calc over canvas so it acknowledges the top and left sides of the screen
- fixed drawing so it doesn't do one frame of draw when clicking on the viewport scrollbars
- changed dropdown back to gray from solid accent color
- added rect select tool
- added new HA_Select for history system
- added masking for the selection and visual for like a blob selection
- added remove from selection
- somehow this broke the line tool so it doesn't become aliased and doesn't add to hist
- changed accent color to teal in light theme

### 24.4.9 : 0.1.1
- added Project.isSel:boolean to detect if there is currently a selection or not and if there's not then it doesn't do any selection clipping
- fixed line tool aliasing and undo-redo
- added real time preview to line too
- fixed selections so updateSelection doesn't get called everytime something is clipped
- added selection preview
- fixed select tool so when you select the tool it doesn't add to hist
- added deselect ability when just single clicking with select tool
- fixed dropdown colors again to be consistent with overall theme
- added rotatable canvas with translated mx/my coords when the canvas is rotated

### 24.4.10 : 0.1.2 ~ Audrey's birthday :D & New Hope 2, sign 3
- [ideas]
    + figured out I can use canvas for pattern for strokeStyle so could use that for something
    + ** particle brush - uses perlin map to spread particles around where the brush draws (maybe like sakura leaves or flowers or dust or something)

- added rotSpeed/Acc with keyboard controls for changing speed to the canvas cont 
- added DEBUG drawEveryFrame which will run the tool's draw method everything instead of on mouse move for use with the autorotating canvas (like pottery)
- fixed glitch where redoing after a non drawing hist action would cause it not to remember what layer/frame was selected (but only visually)
- added label for current tool in tool settings bar
- pointer tool & icon
- added lighten3 background to selected tool in tool-bar
- fixed weird drag issue where it thought it wanted to drag text when trying to drag using tools
- MANY MANY THINGS HERE I NEED TO WRITE DOWN LIKE VER 2 FILE LOADING/SAVING and many bug fixes to that
- added createNewProject function
- !!! - PANEL SYSTEM OVERHAUL - added system so panels have IDs and when updating or targeting them it will apply to all opened versions of that panel; this means:
    - there could be no panels of that type open and no issues happen, it's right where it needs to be whenether the panel is added
    - multiple of a type of panel can be in different places on the screen at once and all update properly and can be interacted with individually
    - fixed panels so they can be added to the left pane
    - converted all existing code to use this system instead of targeting specific cached panels
    - added many helper functions for loadingAll, updatingAll, and stream style generic functions for applying a custom change to all panels with a certain ID
    - fixed global Inst class wasn't storing all the in use panels correctly
- !!! - .QS FILE FORMAT OVERHAUL - updated QS file format from version 0 to 2; this means:
    - this version is exclusive to QSRW and files saved in this format cannot be opened in regular QS
    - layers that don't have data will not be included in saved file
    - introduction of @l and @d for much more efficient and modular storage of frame and layer data optimized for using QSRW's specific animation, frame, layer system
    - added serialize, deserialize to LayerRef for more modularity
    - added "addTo" to LayerRef for ease of adding layers of differing types
    - optimized some parts for faster saving/opening
    - added "addExisting...Layer" for faster and more accurate loading with the new system
    - fixed curFrame, curLayer so they actually work now and you'll have those selected when you reopen the file
    - file saving/opening actually works now reliably for everything except spanning
- fixed history system to properly detect if layers have data or not, improving performance with massive amounts of layers and frames because they will be skipped
- fixed select tool so that it doesn't add to the history if single clicking when over one of the panes (not over the canvas)

### 24.4.13 : 0.1.3
- need to fill this in at some point in time, lots of things including draw with erase, draw with select, and cursor preview for pencil tool

### 24.4.don't know : 0.1.4
- added global key modifiers
- fixed bugs with last update stuff and made it actually work

### 24.4.26 : 0.1.5
- fixed rare issue when moving cursor quickly and then stopping and then clicking once to draw would draw a line instead of a point
- changed overCanvas to be an event and hides the preview cursor when you aren't over the canvas
- changed updateSelection to use faster method but doesn't look as fancy but is way faster especially for higher resolutions
- added simple prompt support for File->New
- added support for File->Save which will use save as if the project hasn't been saved yet
- added support for saving as project and changing the name will change the name properly in the editor
- BUG: using the line to delete, sel, del sel are all broken on size 1 brush size

### 24.4.27 : 0.1.6
- added MenuAPI with some container component stuff
- designed and created New File Menu
- fixed bugs with using the line tool with a brush size of 1
- fixed drawing a single pixel on click didn't add to history (fixed this with something that should fix it for all other cases if they do appear with checking if calcMouse coords is within the canvas coords when using a tool)
- added history support to adding frames
- changed add frames to support multiple and at a different starting point
- fixed tool cursor not showing when creating new project
- fixed tool cursor not showing after opening files
- added support for spans to the .qs ver2 file format
- at some point today I made the zoom faster and added support for pinch zoom with the correct speed (so zooming now works pretty good with ctrl+two finger touchpad scroll, pinch zooming, and ctrl+standard mouse scroll wheel zooming)
- [update1]
- added theme.ts with option to use system theme by default and it works!
- added Keyboard API
- added keybinds for Save, Save As, Open, pencil tool, select tool, line tool, pointer tool
- added keybinds and actions for SelectAll and DeselectAll
- fixed some bugs with selection
- added save dot spin animation when saving files
- added ToolSettings API which uses the MenuComponent from the Menu API
- added BrushSize tool setting to all DrawingTools
- added [ and ] keybinds to change brush size of current tool
- BUG: can't type in input field for tool settings but manually changing it with [ and ] works fine

### 24.4.28 : 0.1.7
- fixed saving animation to be gray so it works on all themes
- fixed tool setting input box so you can actually type in it
- fixed select tool not working after alt tabbing (converted to use global altKey and ctrlKey vars)
- BUG: after saving after a while and then undo to the initial state it says it is saved but technically it's not - probably need to make it where when you save it goes through and removes that property on all older hist actions and then sets the current hist action to be saved
- started adding Colors Panel
- fixed panel headers so they aren't width:100% which overflows outside the panel
- fixed panels so they are display flex to have the right vertical height without calc
- added simple color input picker and opacity input to color panel
- fixed save loading animation so when saving when already saved doesn't have the dot
- added keybind when pressing "c" to grab the current color from the current location

### 24.4.29 : 0.1.8
- probably fixed weird bug where curLayers could get corrupted and cause the entire editor to become unusable
- decided to make cancel button on menus not be accented as well
- fixed standard (none type) button styling for dark and light themes with button css vars
- fixed issue where redoing after drawing on a new layer would cause the history system to break and the new layer data and selected data wouldn't be remembered or restored correctly
- changed cell-h to have nowrap so it doesn't change the aspect ratio of the cells if there are a lot
- added add global and bg layer buttons and icons
- added version label which is calculated from the changelog.md file
- NOTE: insanely nice red maybe could use for UMM: #eb2121ff
- added icon for global and bg layers in timeline panel
- added layer visibility and locking with GUI visuals to timeline panel
- added visibility and locking to history
- fixed issue where saving and opening files with new layers would be broken or forget some of the layers
- in doing some of this a bug where adding layers and/or new frames and saved caused the file to become corrupted
- added custom ops support when creating inputbox-cont for contMargin and gap

### 24.4.30 : 0.1.9
- some bug fixes and tweaks

### 24.5.2 : 0.2.0
- adding anything to the history now marks the project as unsaved
- significantly reduced the amount of times the timeline panel is updated and reconstructed during undo/redo to improve performance
- made it so panels don't update if the hist system is current in Bare mode
- added ColorPalette calculation and swapping of colors
- added basic GUI for colorPalette stuff in colors panel
- added wrapping to button list containers
- [MAJOR-UPDATE] - redid how layer data is stored so ctx's are ONLY defined if the layer isn't empty no matter how you access the layers. *This should reduce RAM usage by a LARGE amount, especially for projects with a large number of frames/layers/resolution. *In combination with the history system this improved undo-redo speed SIGNIFICANTLY and improved timeline reconstruction speed by a great amount
- color palette reassign applies to the entire project (but not undo-redo yet)
- [update1]
- fixed color inputs to make them better with a new function to create them specifically
- removed transparency from Compute Palette
- added margin and padding options to MenuComponent
- added fixed flexbox to MenuComponent
- added sample palettes to swap to
- added undo/redo support to palette swapping
- compute color palette now searches all frames/layers for all the colors in a project
- fixed most bugs with swapping color palettes, especially when multiple layers are involved
- fixed bugs with opening png/jpg files, drag and drop images to load, loading new and old .qs files
- added add global and bg layer icons to history items
- [idea] - added preview label in top left of viewer that shows it's in preview mode meaning changes to main will be applied to the current frame visually but not added to the history or affect the real thing after it's done
- [idea] - click and drag color inps around in your palette to change the order
- [bug] - there are still issues will undo/redo with creating spans

### 24.5.3 : 0.2.1
- changed DrawingTool renderCursor to be closer to the real drawing but it still isn't quite right
- fixed correctCtx and correctCtx_general to have no tolerance for opacity and will replace everything will the specified single color
    - this makes it so when calculating the color palette there aren't a ton of variations from a single brush stroke that was supposed to be drawn with one color
- fixed opening non .qs files didn't work
- fixed opening files by drag and drop didn't work
- fixed global frame was being added before the initial state on non .qs files
- [note] - did some work on the SliceDrawing test and crazy on my Asus it will draw on a 4096x4096 canvas with brush diameter 999 at 60 fps with Nobsin Engine 3 stuff. But it's hard to write the draw functions so I'll probably still stick with NE2 for QSRW

### 24.5.4 : 0.2.2
- many color palette additions and fixes
- color palette reduce stuff but it's buggy
- [bug] when deleting layer data the ctx is still there
- [bug] editor seems to be broken if there are global layers below background layers
- fixed .qs loading if there's data on a layer that doesn't exist it skips it making the file still readable
- added drag and swap ability to color inp
- added shift click to pick color inp
- added ctrl click to menu to use or add to palette from color inp
- added ordering to color palette application but it's buggy and disabled by default
- [update1]

### 24.5.5 : 0.2.3 (2)
- (LOTS of bug fixes)

- !!! - fixed saving with .qs ver2 format so that layer data gets assigned propertly with layer name
    - this bug was with seemingly random sets of 2 layers having their data switched
    - this also fixed the bug where opening files with background layers, the bg layers wouldn't work correctly
    - also fixed bugs with files having background layers above other layers
- rewrote ordering of final editor canvases (canvas cont) to be less buggy and error prone
- fixed spans so undo/redo after adjusting them doesn't break the entire state of the program
- creating, removing, and adjusting spans all works good now and with undo/redo
- fixed spans in .qs file format so that backwards direction spans get saved and reloaded
- spans should now be good
- fixed newly opened files would be unsaved instead of saved
- fixed a lot of cases where Layer.doesShowData() was used instead of Layer.isEmpty() which fixed a lot of bugs and since empty layers are now properly ignored, some RAM usage has been reduced and the .qs file size is smaller too
- fixed other cases of where isEmpty() would return the wrong value or get screwed up after undo/redo
- fixed saving files with no image data wouldn't be openable
- added color palette cols, last cols, and order to be saved in the .qs file format (@cp) which will load when the file is opened as well
- made color palette be stored in full state so undoing and redoing will also switch out the color palette
- fixed ColorInputComponents so the hitbox doesn't overflow outside the right
- added current color and gAlpha to be stored and saved from the .qs file format (@c)
- added cancel endDCan code (but it's disabled right now)
    - it's just a potentially faster version of Project.cleanupEmpty()
    - might be faster if I loop i+=4 and check buf[3] == 0 only
    - this code will probably only save RAM usage so isn't super important
    - if it is added it should be onMouseUp after some tool has been used probably or when something is added to the history
- fixed manualSpan not to crash if layerData hadn't been initialized yet, just creates it and keeps going
- added some helper methods to Project like getByLoc
- re-enabled the experimental ordering and nonreplace options of Project.modifyCP by default
    - "ordering" means if you already have some of the colors in your image it won't replace those and use them in that order
    - "not using replace" means if there are no colors in your palette and you clicked to apply a palette, those new colors will be applied to your palette even though there is non in your picture to assign them to, allowing you to "set/specify a palette" before you've drawn anything
- fixing bugs with color palette made the experimental features less buggy and good enough to be usable
- fixed alphaInp in color panel so that it loads gAlpha
- [update1]
- fixed className having extra space or being undefined on timeline panel TDs
- added tab-col and tab-col-{i} classNames to the custom TDs in timeline panel
- [ideas]
    - so handling TONS of frames is wicked fast, but lots of layers not so much
    - *idea to speed up editor with lots of layers (including editor speed itself & undo/redo)*
        - fix up different things like adding layers to just update those parts instead of having to recreate the entire timeline (not huge improvement probably but could help)
        - probably the best thing is to add a chunk based viewer to the timeline panel so that only a limited number of cells can be displayed
        - the physical state of having 60x200 cells causes a slowdown to the whole site itself even when it's not doing anything
        - undo/redo tanks like crazy with having to recreate that many cells
        - *display: none on table cells seems to make the editor itself very responsive, but it didn't seem to help undo/redo a ton but did a bit*
    - *idea to speed up file saving*
        - (incremental/cached file saving for the .qs format)
        - once you've saved once store the final canvas on the project for later use
        - each layer must store and track whether or not it's data has changed since the last save
        - then, when saving only redraw the changed layers onto the cached final canvas and then save that
        - this means that ultimately save time is dependent on how much you've done since the last save
        - note: the first save will always take the full time, it's probably too slow to create the final cache while opening the file but not sure
            - file opening cannot really get any faster and this seems complicated so idk, not a priority right now
        - *I did performance testing by skipping this step entirely and basically a 60 layer, 200 frame file saves as fast as a 1 layer, 1 frame*
    - *idea to speed up undo/redo*
        - in saving and restoring full hist state, instead of using putImageData and storing the buffers, create new canvases each time for the save and then drawImage for the restore
        - *I did performance testing with this in a different project and found this to be ~60x faster*
        - another improvement could be on Hist to put an n:number value that increments every time a new state is added and that gets stored on that HA
            - then, with different layers that have been mark as changed, also store the current "hn" (hist id number) each time on that layer
            - then when undoing with restore full state, only redraw the ones where layer.hn > hist.n
    - *second idea to speed up file saving / ultimately extend feature support of the file format and support more frames/layers*
        - right now the .qs file format has a image data limit (each frame that has data in it counts towards this) of roughly 16,384 / image_width
        - if layer data is stored in a .zip file then the limit would be however long you are willing to wait
        - chunking this would mean it stores it like the .qs format up to the 16,384 width limit and then creates a new chunk
        - *I did performance testing with this in a different project: a frame size of 64x64 and 16,384 layer datas (that many frames with 1 layer each) saves in around 1.6 seconds*

- changed loadPanel so that it returns the actual Panel it created
- added sticky support to the left header columns in timeline panel
- !!! - added Timeline Panel Chunk Renderer
    - this GREATLY speeds up editor performance, undo/redo performance with massive amounts of frames/layers
    - insanely scalable - the more layers/frames you have it the timeline panel will not slow down, it only slows down with how large you make the timeline panel because the more cells it has the rerender, the slower
    - scroll to pan around it and on end resizing it'll auto fit to the size of the panel
- added crude but working onend panel event listeners
- added debug settings for skipping different file saving operations for testing
- added configurable maxZoom value to settings
- [update2]

### 24.5.6 : 0.2.4
- [bug] spans create a lot of empty space in the saved file
- started adding "hn" stuff for layers but it became too complicated and reverted the changes
- !!! - fixed undo/redo so that it actually uses the most recent full state and just restores from that point to the current point
- !!! - converted most of the "putImageData" operations on HA_CanCopy and HistFullState into canvas for storing instead of byte data for fasting storing and restoring (60x in raw tests)
- changed postEndDCan so that it clears by setting width instead of clearRect
- added noIsSelCalc option to updateSelection so the isSel calculation doesn't happen every time you undo/redo and is instead stored in the full state
- [update1]
- added JSZip library
- added file_formats.ts
- moved a lot of the core meta parse and save of the .qs file format to file_formats.ts
- fixed loadImgFromFile so it revokes the object url when finished
- added loadImg function which is simpler than the other one but doens't track percentages
- added saving:boolean flag to project which prevents the user from saving the project while it is currently saving
- added TOTAL TIME log at the end of any file format saving and opening
- optimized various parts of general file open and save
- added info object on project with "getTotalParts" to see how many non-empty layers there are
- !!! - added new .qsp (Quick Surface Package) format which has faster opening times, significantly faster saving times, and doesn't have a limit to the number of non-empty layers that can be stored

> ![file-saving]
> *64 x 64 : 408 frames : 178 layers : (708 non-empty layers)*
> - .qs
>     - open 186 ms
>     - save 3579 ms
> - .qsp
>     - open 208 ms
>     - save 159 ms

> ![very-large-test]
> *64 x 64 : 408 frames : 178 layers : (3288 non-empty layers)*
> - .qs
>     - impossible
> - .qsp
>     - open 700 ms
>     - save 418 ms
>     - 582 KB

> ![high-rez-test]
> *4096 x 4096 : 8 frames : 1 layer*
> - .qs
>     - open 2440 ms
>     - save 4216 ms
>     - 2.34 MB
> - .qsp
>     - open 1510 ms
>     - save 1930 ms
>     - 2.36 MB

> ![massive-test]
> *64 x 64 : 48,008 frames : 202 layers : (7063 non-empty layers)*
> - .qsp
>     - open 5800 ms 
>     - save 730 ms
>     - 899 KB

### 24.5.7 : 0.2.5
- [bug] when drawing selection on empty layer it thinks it's not empty anymore (this isn't that big of a problem but something to consider)

- [ideas]
- I could store a unique id on frames like how layers are
    - just like _lId there could be a _fId that gets incremented every time a new frame is created and that new unique frame id is assigned to that frame
    - this would mean it has to be stored in fullHistState which isn't too bad
    - this also means it has to be stored in the .qs format which could take a lot
    - ! - oh a better idea! you could add tags to certain frames and then when you needed to target specific frames you specify the tag that it has
        - a time that you would need to target a specific layer could be when specifying ranges for a looping part of the animation and you want to specify multiple start and end positions, using tags it wouldn't get screwed up with deleting or adding layers, but hmm maybe you would want it to shift, there could be an option to specify frame index which can change and then tags which would not change
- Canvas Objects
    - these will be things that exist in the can cont like images you pasted and want to move around, generic objects on this layer, and handles for things like bezier curves or paths
    - have methods like canMove(), canRotate(), canResize()
    - derived class PreviewableCanvasObj which has a preview canvas on it that is always upright and can be drawn to to show the pixelated preview of what the thing will be after it's been rasterized

- added icons: add_frame, delete_bg_layer, delete_frame, delete_global_layer, add, clear, delete
- fixed panel header icon buttons to have the holder styling when they are .hold so opening a dropdown on them makes them stay highlighted
- fixed pasteToLayer so it clears the main canvas after finished and correctly gets added to the history
- added i_frame to Timeline Panel which shows what frame you currently are on and you can input it it to change what frame you're on
- added "confirmInput" utility (which i_frame and brushSize input now use) that calls the update callback when blur or enter is pressed
    - but if the input sent is type number then you can also click the arrows in the box and it'll update
    - you can also press up or down arrow in the box and it'll update
    - you can also scroll over the box (without it being in focus) and it'll update and it adjusts to go at a good natural speed when using a touchpad versus mouse
- added "Add Frame" button to Timeline Panel header
- fixed Timeline Panel menu dropdown to be displayed correctly (up direction instead of left)
- fixed Dropdown API so whatever direction you choose if it's left or right then if it's below half the screen it will be vertically shifted up and if it's up or down then if it's past the middle of the screen then it will be shifted left - this way the dropdowns open naturally and won't be off the screen
- added Delete Layer(s) and Delete Frames(s) options to this dropdown
- added deleteLayers and deleteFrames to Project
- fixed gFileTypes so by default the selected option is "Quick Surface File" which includes both ".qsp" and ".qs" so you can open either without changing the type but there are also individual .qs and .qsp in the file picker as well
- fixed goto in Hist so when restoring the HistAction that was the full state doesn't also call restore on itself (caused some steps to be repeated twice) (also an optimization)
- added temporary solution to invalidating full states on forward future hist actions
    - (notes at the place in code)
    - the current method loops through all future hist actions after the current one when redoing and if it has a full state then it invalidates it (removes the full state and marks it as invalidated)
    - not doing this invalidation can lead to some really nasty bugs and unintuitive behavior as a result of keeping the future hist actions
- added "isInvalidInFutureHistory()" method for future use (not actually implemented yet), deletingFrames needs this because it will always be invalid in the future hist, if you delete frame 5, then undo and add some more frames before frame 5, then redo, the frame 5 to be deleted will not be the same frame 5 you deleted before
- renamed HA_DeleteLayer to HA_ClearLayer and changed it's icon
- fixed when pressing alt would cause the site to lose focus
- moved "q" and "w" navigation to kbAPI registered events
- added "shift q" and "shift w" to navigate vertically in the timeline panel
- added "alt q" and "alt w" to add 1 frame to the left or right of the current frame
- added AddLayerOptions and AddFrameOptions types to their methods for more ease of use with options later (both only contain selectAfter? now)
- added _addLayer to project which gets run for any type of layer added and if ops.selectAfter is true then it'll select the newly created layer (same thing for addFrames)
- added helper methods: getAllSelectedFrames(), getAllSelectedFrameIs(), getAllSelectedLayers(), getAllSelectedLyerIDs()
- added other helper methods: selectLayer(), getLayer(), selectFrame() -- but I might not use these because goto does the job enough
- added setVal() method to InputComponent
- added menuBack to MenuAPI so when a menu is open it dims the screen slightly and you can't click on anything else in the program until the menu is closed
    - this also fixed an issue where clicking a button multiple times that would open a menu would open that menu multiple times
- changed the default name in the New File menu to use .qsp
- fixed the width input field in the New File menu to be selected instead of just focused when opened
- added AddLayerMenu that let's you choose a name for the newly created global or background layer and changed the timeline buttons to use the menu
- changed ColorInputComponent so that it opens its dropdown on right click instead of ctrl click like it should
    - I didn't do this originally because it kept opening the context menu, now context menu is prevented on "hit" container which blocks input when dropdowns are open
- added start and end noUpdatePanel so you can specify a region of code that no panel update will occur for better speed and efficiency
- added icon:string|HistIcon option to dropdown items so they can display an icon on specific options
    - added an add icon to New File in the file dropdown and for delete layers and delete frames
- added timeline cell tag CSS for future use with tagging frames or creating regions in the timeline panel
- changed history panel CSS so all hist action items are title case for consistency
- fixed sizing when buttons are used in header options
- [bug] deleting frame in the middle of span doesn't work correctly
- [bug] when currently selected on a span the preview cursor is frozen

### 24.5.8 : 0.2.6
- fixed main canvas not being added to can cont when on a spanned layer (the preview cursor would freeze and not move)
- fixed deleting frame in the middle and at the start of a span works good now
- fixed bug when the first frame was selected and you wanted to make a new frame to the left it would select the last frame of the animation afterward
- fixed paste to layer so if it's a url that contains .png or if it's an <img> element then it'll work correctly and now paste into a new project with just the image
- fixed pasting images could taint the project with cross origin data so you couldn't compute the color palette on them
- fixed max zoom so the farthest you can zoom is the same across image dimensions and it goes to an amount that won't lag because of the preview cursor rendering, also the new default maxZoom value is 1
- [bug] not sure what caused it, but when pasting into a background layer and did some stuff then saved and reopened the background layer had the wrong image data in it
- (FIXED) [bug] after undo and redoing and then doing save as it uses the original name instead of the new name it last saved as
- added canvas_objs.ts
- fixed copyFromLayer so it doesn't if the layer is empty
- fixed error when hitting ctrl v with nothing in the clipboard
- fixed pasting images so they would paste as a new project with the same dimensions
- fixed pasting so it doesn't taint the canvas and you can still compute the color palette from it
- fixed pasting so you can paste a url or copy an image from discord and paste it in
- added Project.simpleDrawImage utility for this
- fixed Timeline Panel so there's no overflow at all and more properly fits the box
- fixed Timeline Panel to have the new auto adjusting scrolling for use with either a mouse scroll wheel or using a touchpad it isn't too fast and very usable
- changed Timeline Panel minimum height to 2 (which is 3 rows)
- !!! - started adding Canvas Objects API
- added ImgCObj which can display image data
- fixed all loadImage functions so if it error happens it returns null instead of hanging
- added loadImgFromUrl utility
- added working canObjs and selCOs to history full state (restorable with serialize and deserialize on the objects)
- fixed HA_Full to not be able to be invalidatable and check so that if it was it doesn't make an error
- added undo/redo hist actions for DuplicateSelection and MoveCanObjs
- added required id:string property to register keyboard event
- moved copy and paste to registered kb actions and depending on which panel you're in it'll use either the paste into new project or the new Canvas Objs
- added client versions of all mouse coord variables
- changed calcMouse to include client versions of mouse coords
- fixed bug where sometimes the preview cursor would show up while using tools that don't use the preview cursor
- ! - fixed main editor so that you can zoom while also being able to have hover and click events on things inside of the main cont
    - this provides support to being able to click on canvas objs that are in the main cont
- fixed it so tools can not start if they aren't over the canvas
- fixed it so while you are using a tool you can drag anywhere in the whole program (no freezing when dragging goes outside the main editor)
- fixed it so text doesn't get selected while dragging outside of the main cont
- added bare property to edit.deselectAll
- added edit.duplicateSelection
- added edit.calcSelBounds utility
- added Project.edit.copySelection and pasteSelection (which are still work in progress)
- started adding TS_Finish to pointer tool
- added onDeselect and canUse methods to the Tool class
- added PointerToolMode enum
- added functionality to Pointer Tool so you can select, move, drag to select multiple, shift/ctrl drag to add select multiple, and alt drag to deselect multiple Canvas Objs
- moved a bunch of end tool events to only happen if the tool was actually in use which reduces unnesesary hist actions being added
- added curPanel which is a pointer to the current panel you're hovering over
- fixed Panel container to actually use the provided overflow x and y values set by the sub classes
- added copyCan utility
- added CSS for future coloring layers
- fixed layout and sizing of buttons in tool-settings div
<!-- As of this point: 9,956 lines of code -->

### 24.5.9 : 0.2.7
- added pointer-bg and pointer-outline colors so the pointer tool selection looks right on different themes
- added header-bg and secondary to lightwarm theme
- added isNewProject:boolean parameter to pasteToLayer() so you can manually choose whether or not the pasted image goes onto the layer or into a new project
- fixed pasteToLayer so that if it includes any image types at all it will use those (ignoring other things like text/plain that might be in the clipboard)
    - this means jpg and other image types should work but it's untested
- fixed warning null is not in range from the timeline panel that would print everytime on page load
- added pointer and cancel to HistIcons
- added Hist.restoring:boolean that is true during the entire restoring process (longer than the isBare process) and is now used to prevent Hist.add
- added disableForwardHistory setting and defaults to true, it's not necesarily buggy it's just weird to work with at the moment and bug test with
- fixed selectProject so that it updates the curTool (if in one project you have an unfinished action then it won't interfere with the other project)
- fixed closing project so that it gives you a confirm box instead of an alert and lets you close it without saving
- added forceMode:DrawMode property to endDCan() so you can force a specific DrawMode to be used just that one time (used for finished pasting because the draw mode might be erase or select which isn't right)
- added Layer.canEdit() method that lets anything go when isBare is true (might need to change this to restoring later) and cancel if there is a curFinishableAction or if the layer is locked or hidden
- fixed Layer.clear() and Layer.clearSpans() and Project.edit.pasteSelection() so they use the new Layer.canEdit() check
    - this prevents clearing a layers data while the layer is locked or hidden or if there's a curFA
- added return true at the end of both Layer.clear() and Layer.clearSpans() indicating if they were successful or not
- added Project.canEdit() which returns true if ALL selected layers are editable
- fixed deletingCanObjs wouldn't remove their _id from the selected list if they were selected while they were removed
- added saveClipboardData and parseClipboardData utility for easily storing JSON meta data with images copied and pasted to and from the clipboard
- fixed copying selection data to store the x and y location in the meta data and then use that data when pasting
- added working pasteSelection code that starts a new FinishableAction FA_PasteData from the selected data
- added tsRoot:MenuComponent to be accessable anywhere
- moved the Cancel/Finish tool settings buttons to be added at the end of Tool.loadSettings() and be based on selProject.curFinishableAction so that means if you just update the current tool it'll show the curFA properly in the tool settings
- made Cancel/Finish button actually run curFA.cancel() and curFA.finish()
- added selectToolId(id:string) helper function to select a tool by its string id
- added duringFA:boolean parameter to selectTool but I don't think I'm using it anymore
- fixed selectTool so that Tool.onDeselect() only runs when there was a change in tool, not an update
- moved endTool() out of the check because it should run no matter what to fix issues with tool lock getting stuck on
- ! - added FinishableAction API and curFinishableAction onto Project
- added FA_PasteData which takes a canvas as some pastable data and creates a can object for you to move around and then when it's canceled it'll just delete the object but if it's finished it'll paste down the image (this is currently broken as I was trying to add rotate support)
- added startFinishableAction and restartFinishableAction utility
- added CODragType, Corner, and Side enums to Canvas Objs
- moved startDrag and endDrag code to their own methods in CanvasObj with startDrag now requiring the type to start with and these now call lockDrag and unlockDrag
- added starting with CODragType.rotate when mouseDown over a rotate handle instead of the main obj
- added cx,cy,ax,ay,_lastAng properties to SelectableCObj
- added ability to rotate Canvas Objs when click and drag on rotate handle properly rotates them around (no hist support yet for rotate & it's still buggy with showing the preview correctly on the grid since prev needs to be a square but can not)
- added move icon to show when hovering over a Canvas Obj but not when the pointer tool is selecting and hovers over it
- started adding stuff for making the prev can square but it's super buggy and pasting now doesn't paste in the correct location so in the next update I'm going to add a new preview layer to the can cont and draw the preview onto that, elimitating locking the can object to the grid and the preview canvas with overflow issues when rotating or resizing
- removed darkening of background of canvas objs
- fixed rotateTo on PreviewableCObj so it rotates the subCont backwards to compensate for the rotation on the cont
- added rotate support to ImgCObj.render() so it draws without imageSmoothing and rotates (but this code will be slightly changed when I move it to the preview layer)
- fixed clear layers action so if no layers were cleared then don't add anything to the history
- fixed edit.pasteSelection() wouldn't work if there was no selection
- added ctrl+shift+v kb action to paste the current clipboard into a new project
- added pressing escape or enter to cancel or confirm curFA
- added endAllCursors() to just clear the cursor
- added lockDrag and unlockDrag to be used when moving and editing Canvas Objs
- fixed dragstart listener so if dragLocked is on then preventDefault - this fixes the bug where dragging a corner of a Canvas Obj to rotate it would cause a drag event to occur
- added imgToCan() utility
- moved PreviewableCanvasObj canvas into .canvas-obj-sub-cont
- changed canvas obj cont CSS to have animated border and gray when not selected and --accent when selected
- added .co-r corners to the container for the rotate handles
- // history
- added HistAction.canBeFullState() to prevent a specific action from being able to have full assigned a HistFullState (don't think I'm using this yet)
- added curFinishableAction support to HistFullState
- added HistAction.onUndoFrom() that get's called on a HistAction when you undo from that one
- added HistAction.onGoTo() that get's called when restoring and ending on that one specifically (different from restore in that it has to end on this one specifically for it to be called)
- added some restore super code to full states because they don't called restore on them (probably need to clean this up at some point)
    - currently it restartsFA if it is part of a FA chain and calls onGoTo()
- added startBare() and endBare() to restoring full state
- added fa, isStartFA, and setFA() to HistAction
    - fa is stored if this event is either the start of a FA or if it's one of the parts of one (like moving a the pasted data around)
    - isStartFA is whether or not it's the start (paste selection) and if it is the start, when undoing from this HA it will cancel the FA
- disabled invalidateFullState() because it's buggy
- fixed History Panel having errors with not finding the right children against its internal data would cause the whole site to go into a broken state
- fixed all Paste data related HAs to have selectToolId("pointer") in their onGoTo() method so that when going (and ending) on specifically these HAs, it will select the pointer tool and not select the pointer to when restoring to later actions that have to replay these steps (took me 4 hours to fix this bug...)
- changed icon on MoveCanObjs from full to pointer
- added HA_PasteSelection that creates the can obj for moving the selection around
- added HA_FinishFA and HA_CancelFA so finishing and canceling work with good with undo/redo in a nice way where I don't have to write a finish and cancel HA for every FA I make
- !!! - you can now select some data in your layer, ctrl+c to copy it, go anywhere, ctrl+v to paste it and it'll create a can obj to drag around from the image in your clipboard, you can move this around and you can undo/redo at any part along the way undoing the movement steps and the paste step, when you cancel or finish it saves that to history and ends the FA, all of this is properly undo/redo -able and selects the pointer tool only when neccesary and locks and starts the FA (adds the Cancel/Finish buttons to the tool settings bar) only when necessary and during the proper times.
    - Also, this works project independent so if you paste in one project and then go back and forth all that is handled separately and individually without it affecting each other
    - FA works perfectly fine if any of the steps are full states along the chain
    - you can't switch tools during an FA and must stay locked to the specified tool by the FA, pointer tool in the case of pasting
    - after finishing the FA or paste, you can do other things like draw but if you undo you can undo back into the active FA/paste and move the thing around again with the same move steps and re finish it without any problem

### 24.5.10 : 0.2.8
- added scale sides and corner handles to canvas objs
- added anchor x and y to canvas objs
- fixed canvas obj rotate to use anchor
- SelectableObj's update now set's transformOrigin and translate to account for anchors and support for custom width and height scales
- fixed resizeBy to use add instead of multiply
- removed prev canvas from PreviewCObj
- added preview canvas and clearPrev() to Project which will be the top most layer added when loading the frame
- fixed ImgCObj.render to use Project's preview canvas which makes it always line up correctly with the pixel grid and be exactly correct when finishing because it just draws the preview down to main and then to the layers
- [bug] - if there is pixel data on the edges of the pasted selection it will be antialiased, only way to fix this is to add padding to the pasted selection or to write it using NE3 or WebGPU compute shader
- added ability to resize selectable can objs
- added ability to resize multiple at the same time (corners)
- changed HA_MoveCanObjs to HA_TransformCanObjs which stores the x,y,a,sw,sh,and anchors (but not used)
- removed update to all canObjs that happened when zooming because it's not needed anymore with using the project preview canvas
- fixed while being in a project that had a curFA and then went to another project that didn't, changed tools, then came back it'll now update the tool correctly and bring you back to the locked tool (update the tool when selecting projects)
- ! - pastable data should be mostly done other than some touchups, holding shift and resizing with the corners doesn't work and the icons aren't correct when rotating or resizing using the corners but functionality wise it should be good but there seems to maybe be some bugs with undoing the finish HA it doesn't remember the correct rotation or scale in the last step
- fixed deleting can objs so if the deleted ones is stored as hoverCO then hoverCO gets removed
- added endAllCursors() to FA_PasteData so your mouse cursor won't get stuck on something changed during the move process

### 24.5.11 : 0.2.9
- added fill tool icon
- added select_pointer icon
- changed HA_Select to include if it's a move or not with changed text and icon
- added pressing the f key to change to fill bucket
- fixed bug where erasing or seleting with the Pencil tool and then updating the tool settings would have the name "Erase" or "Select" on the tool bar instead of "Pencil"
- made PointerToolBase which PointerTool and SelectPointerTool extend from but this might not be needed anymore with how the select pointer tool works by just click and drag to move the selection around
- made SelectPointerTool click and drag to move the selection around with undo/redo support
- added FA_EditSelection but it's not used
- [bug] - need to fix finish SelectPointerTool so it doesn't screw up the selection because it's not full opaque black because it's just drawing the preview canvas with the selection color down right now

### 24.5.12 : 0.3.0
- probably fixed issue with copy and pasting selection and then undoing wouldn't let you move the selection around
- fixed undo/redo with full state would cause tools not to work anymore because it didn't reset Project.hoverCO
- added forceMode option to HA_CanCopy
- added HA_CutSelection that takes bounds as input and will clear that section
- added ctrl+x to cut the current selection which copies the selection to the clipboard and then deletes the bounding rect around the selection (works with undo/redo)
- fixed finishing paste data from selection wouldn't clear the preview canvas
- fixed bug where pasting data would be updated the first time and it would be blank

### 24.5.13 : 0.3.1
- added pause and play icons
- remade fill bucket icon (fill4.svg)
- added db.ts
- added borders between multiple panels if they are in the bottom pane
- fixed CSS layout stuff with multiple panels within one pane
- added cutFromLayer()
- added isCut option to HA_ClearLayer
- added isFill option to HA_Select which changes the label text and the icon
- added HA_LoopSelCopy which will record the canvas data at all the selected layers

- added indexedDB for recent files stuff
- added getRecentFiles(), addToRecentFiles(), and clearRecentFiles()
- recent files system works and works good (but doesn't rearrange the order when opening new ones yet, and there's no cap on the amount yet)
- added requestPermission for readwrite when opening files if needed

- added execEvent() to kbAPI so you can manually execute an event by its ID

- fixed Project.canEdit() to be false if the current tool is inUse
- changed curFrame to use getter and setter so that the current frame cannot be changed if a tool is in use (for async tools)
- fixed so you can't delete layers or frames if you can't edit the project
- added Project.loopSelAsync() to asynchronously loop through all the selected layers

- moved zoom and pan system in the editor to be properties on the project with updatePan, updateScroll, and updateZoom methods (this makes an external reset view possible)
- added resetView() to Project
- renamed "Paste image" to "Paste to layer"

- added mainTick loop that calls the new tick() method on Tool

- fixed MenuComponent.createIconBtn() to support HistIcon instead of just string for icons

- added MiniPreviewPanel with pause and play button that when playing will loop through the current project with respect to it's set FPS
- added MiniPreviewPanel to the left pane
- fixed not all panels getting updated when the page loads or when selecting projects

- fixed PencilTool when using size 1 brush size and erasing it does the realtime erase instead of the pink preview
- make Tool.onUp kinda partially work async
- fixed FillTool so it extends DrawingTool with a fixed brushSize of 1 with no setting so it properly switches the preview cursor size when switching tools
- implemented FillTool flood fill algorithm using the recursive algorithm with a stack
- added support replace select, add select, remove select, draw, and erase modes with fill tool
- added fill tool being confined to selection
- added drawData helper function for drawing 1 pixel using different draw modes
- added getDrawMode() helper function based on modifier keys

- changed Panel so it doesn't get added to the specified panel in the constructor but now after calling the addToLoc() method
- added resizes to panels within panes
- moved resize setup code to setupResize() function
- added experimental dropdown for swapping a specified panel with another
- added support for switching a panel out for another one and still be able to be updated properly
- added automatic class assignment in genBody()
- added support for using HistIcon instead of just string with createHeaderOption()
- added noAdd:boolean option to addPanel()
- added removePanel() method to Instance

- changed dropdown items to use the class dropdown-items instead of " > div"
- added CSS hold support for dropdown-items
- made the dropdown hit container have stopPropagation on it so when clicking on the canvas to close a dropdown menu it won't draw onto the canvas
- added type property to setupDropdown items (only hr is supported right now for a hr in the dropdown)
- fixed sub dropdown support where clicking on a sub dropdown item twice would cause it all to close
- added dropdowns for the rest of the menubar buttons
- added open recent sub dropdown in file option
    - reads the files in descending date order with the title of the file along with the date and time that it was added
    - clear button at the bottom
    - opening a file that has already been opened will just switch to that one will just switch to that one
- added: Undo, Redo, Copy Selection, Cut Selection, Paste Selection, Paste Into New Project - to Edit dropdown
- added: Reset View - to View dropdown
- added: Copy Layer, Cut Layer, Paste layer - to Layer dropdown

- fixed pointer tool selection and can objs with pasting and transforming to work on a rotated canvas at any angle
- changed styling of scrollbar to be more subtle and consistent across different platforms

### 24.6.10 : 0.3.2
- (start of mobile compat)
- added no scalable viewport stuff to html
- added mobile-list
- added UniversalMouseEvent system
- added UniversalMouseEvent stuff as parameters to some of the tool methods
- added PanTool
- broke all tools using the mouse at the moment, try to fix in next update
- you can now draw and use all the tools using the touchscreen and pan and zoom intuitively using the pan tool (on mobile or desktop)
- added allowTouch() and onTouchMove() methods to Tool
- added safety for drawLine() so it can't get stuck in an infinite loop
- added helper onUp, onDown, and onMove functions
- added mobile.ts and mobile.css for adjustments for the mobile mode when the screen is small enough (all that's useable in this mode right now is drawing, panning, switching tool, and changing brush size)
- (possibly more here from the previous push called transfer)

### 24.6.11 : 0.3.3
- added getName() method to panels for better readability
- added setConstantDrawMode() to Project for constant use of a specific draw mode in the mobile mode
- fixed cancel() so by default it works correctly on menus
- fixed menu api so that it manually sorts zIndex by what child it is in the list and also does this for dropdown downs in the menu cont
- fixed hit cont not being right for dropdowns that were opened while a menu was open
- added EmptyMenu for quick creation of custom menus in the mobile mode
- added createIconBtn helper function for mobile mode
- added button to open tool settings in mobile mode
- added button to open menubar commands in mobile mode
- added button to open panels in mobile mode
- added buttons to undo/redo in mobile mode
- added buttons to go to previous and next frame in mobile mode
- added button to switch DrawMode in mobile mode
- added quick color component in mobile mode for changing the color at any time
- drew settings icon
- fixed cursorPosition didn't get updated onMouseDown
- other small fixes and tweaks
- added better close method to dropdown menus
- added Deselect All option to MenuBar -> Edit
- added animations to menus when opening
- fixed issue when using touchscreen on desktop would sometimes cause the swipe left to go back thing to show up
- added icon-cont for more consistent icon styling
- added noAdjust and openAfter options to dropdown menus

### 24.6.12 : 0.3.4
- need to fill this in at some point but mostly final fixes for mobile support

### 24.6.13 : 0.3.5
- need to fill this in at another time but added Resize Project, many bug fixes, added support to save as png, jpg, added time spent calculation, and added Project Info Menu

### 24.6.13 : 0.3.5.1
- added update app button
- added online message saying you can't update if you're offline
- added error message if you try to get version number when offline

### 24.9.3 : 0.3.6
- (todo)
- > rename layers menu
- > tooltips
- [update1]
- added open animation to dropdowns depending on direction
- fixed/tweaked some things about dropdowns
- added option for dropdowns to be added to the menuCont so they can appear outside of div's that have overflow:hidden
- changed menubar so that hover to speed through all the dropdowns in the menubar works now
- added rename layer menu
- fixed ctrlKey, altKey, etc. detection so it actually works properly now
- changed the fill tool to be asynchronous at high resolutions
- added project edit lock for use with asynchronous tools which blocks starting tools and makes Project.canEdit() return false
- when filling asynchronously, you can still pan and zoom around the editor but it prevents you from editing anything, creating layers/frames, whatever or undo/redo until the fill has been completed or canceled to prevent issues
- when an async tool is currently running for more than 300ms, you can press escape to cancel it (works for the fill tool right now)

### 24.9.5 : 0.3.7
- (on github rn)
- but mostly GIF export with menu

### 24.9.7 : 0.3.8 - Audrey req to followed me on IG today :D
- (todo)
- > edit -> set all pixels in selection to a specific alpha or by add or by mult
- > pressing delete/backspace will only delete the selection
- > merge layers down/up
- > opacity as 0-255 instead of 0-1
- > reorder layers
- > remember scale of panes and which panels are in each page for the file
- > custom palettes file and program specific that get remembered
- > ! - search panel (maybe in the right pane?) that let's you perform a search query something like search for all pixels that the red value is 255 and the green value is between 100 and 150
    - it will then give a list of the results starting with the one with most matches
    - (there will only be multiple results if you specify a range)
    - hovering over one of the results will highlight it in the current frame (may also dim the pixels not selected)
    - button at the bottom to automatically add those those pixels to a selection

- fixed history panel overflowing and not being scrollable when it got longer than it's container
- changed when adding new panels that it'll scale them to 100%, 50%, 33%, etc based on how many there are in the container
- some various things that need to be filled in at some point
- added replace and multiply blend modes
- added blend mode tool setting but still needs more work
- using other blend modes with undo/redo is still very broken at the moment

### 24.9.8 - 0.3.9
- blend modes should be fixed now (worked in all situations I tested)
- (the blend modes core feature was rewritten and tweaked in places to be simpler and support the custom blend modes)
- (replace and multiply still have no preview though but they do work)
- [update1]
- lots of fixes (need to fill in later)
- started tooltips (just added tools for now)
- buttons to move layers up and down
- clear from selection only (not a rect) that get's used when you are over canvas and press delete/backspace (this might have been in the last update but I don't remember)

### 24.9.11 - 0.4.0
- started working on adding enabledChannels with projects so that you can display just a single channel of the image at a time, and hopefully modify it with just a single channel too

### 24.9.14 - 0.4.1
- fixed using 1x1 brush size with translucency wouldn't work as intended (would tint pixels that you've already drawn since the last mouse down)

### 24.10.7
- **need to disable pointer-events on project-overlay and then put some event listeners on the main interface scrollbars to be able to drag to move around**

### 24.10.9
- fixed scrollbars in main editor to actually work and be controllable
- started adding compute region menu

### 24.10.12
- (need to fill this in later probably)
- added more tooltips
- added working Fill Mode and Region Mode to the Fill Tool (didn't do much testing but seems to work good at least for the regular blend mode)
- added dedicated eraser tool

### 24.10.13
- fixed bug with dropdowns and tooltips causing massive spamming (open and close tooltips really fast)
- (lots of things need to fill in)

### 24.10.14
- removed tooltips from mobile mode for now to prevent bugs
- some fixes to remove color warnings from the console
- fixed picking color so that it also picks the alpha channel
- fixed the eraser icon in the history

### 24.10.15
- various things but mostly worked on trying to add the radial color wheel (not working properly yet)

### 24.10.18
- did more fixes and work on the radial color wheel

### 24.10.19
- finished color wheel
- added hex field to mixer
- improved performance slightly for mixer dragging sliders
- finally added setCol method to project so that it updates correctly across panels when one main color changes
- also added the same for gAlpha
- fixed gAlpha to be able to be scrollable to change
- added colorUpdate() method on Panel to make this work more efficiency

### 24.10.25
- added area dropdown to compute region menu

### 24.10.26
- fixed dropdowns to work in menus (somewhat of a bandaid fix for now but seems to work if only 1 menu is open at a time)

### 24.10.27
- (fill this in later, pretty big update)

### 24.10.28
- fixed issue where undo/redo out and back into a FA_Spline would cause a previous selection to disappear (causing selections not to be usable with splines)
- started adding sub handles for spline tool (not working yet and breaks undo/redo)

### 24.10.31
- added onZoom() and skipSave() methods to CanvasObj for event listeners when zooming in the editor and to skip saving when it goes into the history to prevent duplication when redoing
- fixed polyline handles to remember their sub handles between undo/redos
- fixed referencing with handles and their parents
- added experimental sub handle beam
- fixed a couple bugs with canvas objects and the history

### 24.11.1
- more fixes to spline tool sub handles (still not completely working yet)

### 24.11.3
- added the spline FA to actually render a bezier curve based on the locations of the handles
- fixed spline FA so that applyEffected and correctCtx are used to fix the antialiasing
- fixed handles/sub handles so that they don't break with undo/redo
- fixed drawing handles so that the sub handles don't get offset based on the order that they were added
- fixed creation of sub handles so that the actually get created with the correct locations
- moved handle start and end coords into moveTo and rearranged the order of events to fix bugs, actually work properly, and improve performance
- added quickMove helper function to improve performance with sub handles
- added updateSettings() method to FinishableActions so that you can have render updates happen when tool settings are changed or when the current project color or gAlpha is changed in real time
- added applyEffectedInstant for when future multithreading support isn't really an issue so it can be forced to be done synchronously
- added helper to spline tool so that if you click and drag when creating new handles their start sub handle will point towards the previous end handle and then the end handle will be the same length and 180deg from it to line up better

### 24.11.4
- (not all of these changes are in order in which they were added)
- changed startBare to take a HA as an argument so when restoring properties like modifier keys can be remembered per HA
- added remove, removeStr for color palette with an option in the dropdown menu so you can remove colors from the palette now
- changed selecting can objs so you can only do it with the shift key because ctrl is used for the joint handle move (may need to adjust this later if I want shift to be used as a can obj modifier)
- added makeCorner static method on SplineHandle (doesn't do much on it's own but it's for making polyline points with no handles)
- added tmpDDCan for dropdown menus globally on the screen (good enough solution for now)
- added basic support for context menus for canObjs
- added removeHandles() and removeHandle(i) to SplineHandles with context menu options and full undo/redo support and holding alt while clicking on a sub handle to remove it
- added restoreBothHandles() and restoreHandle(i) to SplineHandles with a context menu option and full undo/redo support
- added support for limited/no handles with the curve adjusting and no handles just turns into a polyline with hard corners
- fixed onAdd() method for SplineHandles to reduce a lot of bugs, especially with undo/redo and be able to work with limited or no handles
- added shift back and shift forward for adjusting the order of points in the curve with full undo/redo support and are options in the handle context menu
- fixed existingHandles property becoming contaminated or corrupted after undo/redo back up the history because it wasn't copies when deserializing
- added using ctrlKey on a spline sub handle will mirror it to the other spline handle for a smooth transition at that point
- added removing spline handles with full undo/redo support and context menu option
- temporarily fixed up rendering sub spline handle beams to not break with a distance of 0 or when zoomed out really far or really close
- added BareStack to the Hist class so you can nest bare states with modifier key states (effectively making it so hist actions can automatically remember if shift, ctrl, alt... was held so these modes don't have to be stored on the HA themselves and they can be restored correctly with the right modifiers held down)
- fixed going to somewhere in the history so that if there is a current FA then it will always be updated after the undo/redo happened to be reflected of the latest changes
- fixed TransformCanObjs would sometimes return too early without ending the Bare so future actions wouldn't be recorded in history
- new HAs added to the history system: DeleteCanObj, RemoveSplineHandle, ArrangeCanObj, RestoreSplineHandles
- added Ctrl+Shift+D to deselect all can objs
- fixed TSUtil_Combobox to properlly call update when its value is changed so a curFA can be updated in real time
- added TSUtil_Checkbox to use labels with checkboxes in the tool settings bar
- added TS_UseTransform and changed the shape tool so that by default transform is turned off which makes it apply immidiately when using the shape tool which makes it compatible with blend modes (multiply, select, erase...)
- but using transform does not work with blend modes (at the moment at least) and upon drawing it will create a move transform FA
- non transform shape tool now works with blend modes as well as masking to existing selections (but the select blend mode is colored incorrectly and selections or blend modes don't affect previews, only the final draw for now)
- added LineCap and TS_LineCap to SplineTool with None, Round, Square with support in the preview and final draw
- added SplineInsertMode and TS_SplineInsertMode to SplineTool with "Bezier", "Bezier Manual" and "Polyline" with full support
    - bezier is like illustrator where you click to place a point and then drag to adjust the sub handles inversely where your mouse is
        - also just clicking without moving will create a point with no sub handles (polyline)
    - bezier manually is mostly just adding a point and dragging with just change the position of the main handle
    - polyline will automatically create no handles on each added point
- removed blendMode from spline tool because it isn't compatible at this time (maybe later)
- other random bug fixes for the spline tool
- changed main editor so standard context menu is prevented (to open up possibilities for custom context menus)
- added noHit?, onClick(), onMainClick(), noClassAdd? options to setupDropdown
    - noHit means the hit container isn't enabled so you can still click on other stuff while the dropdown is open
    - onClick() is fired when clicking on any option
    - onMainClick() is fired when opening the dropdown
    - noClassAdd means .dropdown-btn isn't added the clicked element

### 24.11.5
- important equation for calculating height in pixels of a panel within a container: `temp1.style.height = (r.height-(temp1.getBoundingClientRect().top-r.top))+"px"`
- added horz_pane and vert_pane classes to the HTML to be able to distiguish
- added horz_pane and vert_pane styling
- fixed shrinking of headers in panels when resizing
- fixed t to toggle the bottom pane so it actually works even if there's more than one panel in the bottom pane
- fixed MixerPanel so that it has vertical overflow
- fixed bottomPanel on Inst so that it can be an array of Panels just like the other panes
- added index parameter to addToLoc for panels
- fixed addToLoc so that it properly sizes panels when they're added
- fixed swapping panels with other types so it actually works
- added replacePanel method on Inst
- rewrote a bunch of the resizing stuff for panels so if there are 3 panels and you resize the top one then the bottom 2 fold like an accordian (mostly intuitively)
    - there is a couple bugs when dragging panes will cause various panels to resize (ones at the end to gradually get smaller)
    - also a bug of according folding makes the next adjacent paneL gradually grow towards 0.5, 0.5 instead of always keeping its proportions 
- ultimately fixed dragging panels so they scrunch together without overlapping or going off the screen, be scrollable correctly, and work also with muliple panels in the bottom pane

### 24.11.9
- fixed shrinking the left pane would have the panels overflow content
- added eye dropper tool with functionality, right click menu, and icon
- eye dropper right click menu can "pick color", "add to palette", and "copy hex"
- added "g" keybind to select eye dropper tool
- moved pickColor(x,y) code to Project
- fixed bug where right clicking with a tool and then left clicking would require a second left click to start the tool again
- moved dropdown ops into it's own type: DDOps
- added openDropdown() function to open dropdowns immidiately at a specific place on the screen without having to use setupDropdown
- fixed recent files dropdown so that when it overflows the screen it will correctly be scrolled to the top

### 24.11.10
- (need to fill this in later)

### 12/4/24
- modified main.css vars so that the grid image, grid-size, canvas-border, and canvas-bg are all configurable by adding a class to body
- added setting: s_scaleMatchGrid which will make the grid size change to be scaled (this is now being set on loadFrame if the corresponding setting is enable in settings, but this will be here for now)
- added scaleMatchGrid and solidCursor settings (both are working)
- added global flmx, flmy, and isNewPixelLoc variables for testing if the cursor had been moved to a new location on the grid to limit updates
- changed correctCtx_general so that it can support custom tolerance
- added getVisiblePixel() function to Project so that you can iterate through all the layers at a certain pixel and get the first one it hits
- updated updateCur() so that it considers the pixel under it and changes the color of the cursor to always be visble over the color that is under it
- added solidCursor setting so the cursor just simply draws the canvas patten without the outline logic
- ! fixed major bug where non square canvas aspect ratios didn't work
- added color parameter to renderCursor() and modified the existing renderCursor() implementation to support custom colors with outline and solid cursor
- added createQuickToggle() utitlity for quickly adjusting settings from dropdown menus
- added scaledGrid and solidCursor setting toggles to the view dropdown
- increased the border size of the fancy cursor (outlined/solid)
- added toggle styling
- attempted to fix cursor changing shape once the mouse moves, it's not right yet but the cursor is the correct shape when changing brush size without moving the cursor

### 12/6/24
- ! fixed rearranging layers was broken

### 12/9/24
- small amount of work done on preview in timeline panel

### 12/15/24
- bug: adding a new frame in the middle of a span creates a disjoint span
- added global --grid-aspect css var to be usable anywhere for the aspect ratio of the canvas
- fixed bug: making the panel larger with a larger preview size meant less space so it was clamped so then you scroll horz forwards, then reducing the panel size and giving it more space would not expand the panel would not auto adjust
- fixed width calculation formula for the timeline panel's chunk based renderer to be closer to the truth space available and work with the preview div however it's scaled
- moved loading the TL preview into it's own method and added it to Hist.add so it should get called at all the proper times
- fixed styling for the TL preview to make it better and more complete
- fixed TL preview to support different aspect ratios
- ! Timeline preview has been added to view individual cell image data and should be working!

### 12/23/24
- moved the resize and rotate canvas object logic to a new class ChangableCObj so new objs don't have to override ImgCObj to use it
- added experimental CameraCObj that is movable, scalable, and rotatable
    - added a menu button to create a camera and it works with undo/redo
    - not fully usable yet and it gets erased on reload and there isn't a way to get out of the camera view in the editor yet or save its state to frames yet
    - changed mini preview panel to auto detect if there is a camera in the scene and switch its view to it if so
    - works with animation and scale and rotation although when custom scale is involved it doesn't line up quite right
- added more type defs to some internal stuff
- added removeFromRecents() function with working minus button in the dropdown
- fixed open picker so it accepts all types by default, same for save
- added Rotate selection, flip selection, and create camera history actions
- added support for pressing Escape to close dropdowns
- added debug toggle for turning on and off the cursor to see performance differences
- added _overDropdown global var for testing and getting if you are over a dropdown currently
- added updateCurPosMXMY() function to Project to specifically set the cursor to the mx, my location locked to the grid
- majorly revamped the smart cursor render stuff and contrast detection to be way better, more customizable, and significantly faster to compute
    - they now are controlled by CSS filters so changing color doesn't require a re-render of the smart cursor and it can be animated (and it is :D)
    - also added checks so if the location of the cursor and size never change then it won't re-render, this significantly improves performance and it also fixes the most devious bug so far found within this project!
    - so this fixed the major bug of resizing the cursor was fine but then when you went to move the cursor around it would become deformed
- adjusted contrast formula to cover a better range of colors
- fixed ctrl zooming on main editor to detect a little easier and support panning and zooming while a dropdown is open over the editor
- added rotateSelection, flipSelection, edit functions to Project
- added before unload prevention when leaving or refreshing if there is any unsaved project
- added debug/experimental PanelMenu which is a menu that can render content from Panels
- started adding EditPixelsPanel
- added allowedMouseButtons() getter function to Tool so you can specify which mouse buttons are allowed so you don't have to check for them on all tools and so right clicks are prevented unless allowed by this method if you want specific functionality
- fixed resizing the brush so it always aligns with the grid and doesn't bounce back once the mouse starts moving
- fixed rect selection tool to show the cursor
- fixed rect selection tool so when erasing selection it shows the proper pink erase selection color
- fixed rect selection tool to be more satisfying and intuitive and natural like the shape tool when drawing selections
- fixed creating dropdowns while dropdowns were already open in some cases where it was broken and would duplicate
- added Quick Settings dropdown or the editor right click menu with the current x,y, location, current color as an input element that can be accessed and taken and added to the palette as well as the following options: copy hex, adjust pixels (opens up a blank menu for the time being), turn 90, turn -90, turn 30, turn -30, turn 180, flip x, flip y -- and those are all implemented and working on selections - haven't tested if they work across multi selected frames yet but should
- quick settings menu should work pretty good and be fairly intuitive and work well
- added openDropdowns[] global var to simply access the list of all dropdowns in case they're needed
- added onOpen() method to dropdowns
- removed auto close all dropdowns when one is opened, hopefully this doesn't break anything by removing this but it is needed for the quick settings to work
- added closeSingleDropdown() function
- added try/catch to opening a file from recents so if something fails then it will alert saying something went wrong, it won't tell you anything else but at least you know the program didn't lock up and is responding

### 12/25/24
- added hex and pixel icons to "copy hex" and "adjust pixels"
- fixed .hide css class so it's !important
- added HA_AdjustPixels for undo/redo
- added support to close SubWindows by pressing Escape
- added runCalcMouseStart() helper function to init starting mx/y and cmx/y anywhere if needed
- added debug "sourceIn" blendmode
- ! added "adjustPixels()" function to Project which takes in an array of the channels you want to modify and how they will be modified
- added optional width option to ButtonListItem options
- added mainSWCont element to MenuAPI; this is just another container but to put SubWindows in
- ! added working SubWindow API so they can be created, closed, and dragged around
- added extra checks around the program so you can't draw on the canvas when over a sub window and the preview cursor doesn't follow along when you're over a sub window
- added ActionOp (action operator) enum and corresponding info data
- ! added complete working menu for adjust pixels
- fixed number input fields so they stop wheel propagation and don't scroll the editor when scrolling in the input box

### 12/26/24-A
- added working "pick color" option to the quick actions right click menu
- fixed quick actions right click menu so it spawns relative to the client mouse cursor location so pick color will always be directly to the right of the cursor at the same relative distance
- changed scaled grid on to be the default
- added calcSelBoundsOrWhole() and clearFromSelectionOrWhole() to pick the whole canvas if there was no selection
- fixed rotateSelection and flipSelection to use the "orWhole" methods so they can work on the whole canvas if not selected
- added onEnter() and onKey() events to SubWindowOps
- fixed adjust pixels sub window so pressing enter will confirm the options and run
- fixed editor scrollbars with new method: so they will only become scrollable if your cursor is over that region so it's like normal if you're mouse is not over the scrollbars, otherwise they get enabled and do work!
- small update: fixed major bug where rotated whole layers would be marked as empty and would not be saved

idea:
- modifiers so you can say okay on this layer I want to just visual clone everything along the x axis or by 180deg
- save selections to a list and reapply then when needed, name and search for them

### 12/26/24-B
more ideas:
- to open a folder and then recursively loop through and for all .qsp files in there, export all to png in their relative folders, that way you can work on them as .qsp files and then export them automatically when they're ready
    - need to somehow make a way for it to keep track so it doesn't export all of them each time
    - or wait actually, you can open up the PNG files but they have .qsp file alongside it and maybe could load from that? oh boy that would be complex
    - maybe just open a png if you want png only features, open a .qsp for its features and when saving or quick export have it export to a png in the same folder

- added recent folders object store to db.ts
- added addTo, removeFrom, getAll, clear functions for recent folders as well as global openFolder() and _openFolder() functions like the corresponding file ones
- added check to universal _openFile to check if the file has already been opened then switch to it which always prevents the same file from being opened twice
- ! added working FolderViewPanel that can open the list of recent folders and view the files and folders inside
    - refreshing remembers which folders were expanded
    - clicking on files will open them as projects immidiately with no confirmation
    - there is an icon displayed to the right of a file if it's open at this time
    - scrollable if the list is too long for the container and remember the scroll position
- ! added postParent? and useCursorLoc? properties to DDOps
    - postParent makes it open like if it was called from setupDropdown from a particular element (except it still goes into menuCont instead of being attached to that element)
    - useCursorLoc makes the dropdown auto appear at the mouse location
- fixed reporting error when it failed to load a file from recents so it actually logs the error
- added "Open Folder" button to the file menu dropdown

### 12/27/24
- fixed removeFromRecentFolders
- fixed folder panel so the right click context menu is always prevented
- added hasSearch and onRemove to folder panel
- added support so you can remove items from the recent folders
- added data? to DDItem in case you need to simply store data per item
- added hasSearch and onRemove to dropdowns with automatic styling

### 1/7/25
- fill this in later

### 1/30/25
- renamed title from "Quick Surface Rewrite" to "Quick Surface 2"
- added static updateIfPaused() method to MiniPreviewPanel and added it to update at proper times like when undo/redoing and adding new things to the history
- started adding very basic tool tooltip stuff for future use in the status bar
- added ellipse ShapeType
- added working ellipse shape functionality with shift making it lock to a square aspect ratio and holding alt to make it lock to the center
- added the same for the rect shape as well
- fixed timeline preview would be on the left side for single frame images
- fixed color of selection text in folder view in light theme