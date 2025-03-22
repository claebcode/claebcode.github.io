# Logic Tab (Smart Objects, scripts, etc.)
- create Light Source
    - this smart obj will produce a light around it with additive blending but can be configured at run time
    - maybe instead of [Logic] this should be under Object -> Add -> Light Source

- selection map panel

# from Eston
- select an area and then stretch and warp it

# nice colors
- 179,30,30 - nice red
- 197,17,53 - nice nice pinky red
- #D6616D - insaneee red
- #E6414C - crazyyyyy red

#
- palette menu to come up where you can do a lot of organizing and create folders and then you can load a folder at a time (or multiple) in the mixer or color/palette panel
- tool settings panel
    - for the spline tool it can have the order of the points and allow you to specify manual values and change their order
    - for other tools you could specify more properties
- tabs in center panel for other fullscreen panels like a list of all the variables/objects you've stored
- objects panel that will show a list or grid view of object preview, name, and type of object that it is, you can drag it into the editor or add from a dropdown menu of options
- if there are more options for a FA, in the cancel/finish there can be a vertical ... dropdown with options like convert to object or export as object so this pattern can be saved for later
    - any input box should be assignable to a variable
    - you should be able to create object templates by assigning some of the properties to variables that are configurable
    - in the tool settings/properties panel there, with the input boxes for all the manual locations for different points along the spline, these should all be configurable with variables
- variables panel with temp list that can be wiped/cleared easily
    - adding variable with specific value, adding relative variable like var2 = var1 + 10
    - you should be able to make local variables on particular objects that are local to just them, like fields on a class
- for objects, specifying manual location, rotation, scale: should this be in a new object properties panel? or in the tool properties panel when the move tool with an object is selected? probably the later

- in the variables panel, to be able to setup presets that may load different tools with specific configurations
    - like a pencil tool category and then different presets for that, presets could also contain different colors pre-set

- for storing panel/workspace layouts
    - there can be an array for the center, main area and then it has an array of some class to represet storage for a panel configuration
    - at the very least it would be an array of items, each item either being an object that has an id of what panel it is with serialized data to restore with a specific panel configuration (like objects panel being in grid view instead of list view) and then some with be a sub list that can hold more panels, maybe
    - when things are resized need to use something like this formula, panels will only ultimately work if the heights become in px:
        (temp being the panel HTMLElement and r being the client rect of it's parent)
        `temp1.style.height = (r.height-(temp1.getBoundingClientRect().top-r.top))+"px"`

--- 11/7/24
### selection info panel
- left, right, top, bottom, width, height (or sx, sy, ex, ey, w, h) of the bounds of the current selection
- also have RGBA and if all the pixels in the current selection (ignoring fully transparent pixels) all have the same red value then R would be that value, otherwise it'll be a "-"
    - you can manually type in a value to set all the pixels in the selection's red channel to the value you set, or beside the input there will be an option to select mode and then an input so you can change the mode to add and then type -10 for all the pixels' red channels to decrease by 10 relatively

--- 11/9/24
### 
- be able to write notes about different files in a folder or just notes globally on a project with checkboxes of things done
- be able to open folders which will automatically open the folder panel which will let you open multiple files from a folder quickly 