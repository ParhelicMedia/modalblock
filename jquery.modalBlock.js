;(function($)
{
	//Define plugin methods.
	var methods =
	{
		//Initilization function to setup object.
		init: function(options)
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);

				//Set defaults and import passed settings.
				var settings = jQuery.extend(
				{
					blocker_opacity: 50,			//A number from 1 to 100.
					blocker_background: "black",	//CSS background string for blocker.
					blocker_zindex: 0,				//z-index of blocker, or 0 for auto.
					blocker_close_on_click: true,	//Clicking the blocker closes the modal.
					blocker_showing: false,		//Flag to tell if the blocker is currently showing.
					block_stack: [],				//An Array that holds the blocks currently being shown.
					block_current: null,			//The current block set in show();
					show_delay: 0,					//Millisecond delay between call of show method and actual display.
					reposition_delay: 0,			//Millisecond delay between call of reposition and actual reposition.
					reposition_x_denominator: 2,	//The denominator value used to calculate the modal horizontal position.
					reposition_y_denominator: 2,	//The denominator value used to calculate the modal vertical position.
					hook_show_before: null,			//Hook to call a function to execute before a show occurs.
					hook_show_after: null,			//Hook to call a function to execute after a show occurs.
					hook_hide_before: null,			//Hook to call a function to execute before a hide occurs.
					hook_hide_after: null,			//Hook to call a function to execute after a show occurs.
					isShowing: false,				//Flag to tell if the blocker is currently displaying or not.
					owner: this					//Owner of the modal block, AKA the container.
				}, options);

				//Store settings in the object for subsequent calls.
				$this.data("modalBlockSettings", settings);	

				//Retrieve the current blocker, if set.
				var blocker = $this.data("modalBlockBlocker");

				//Create a new blocker if not set.
				if(!blocker)
				{
					blocker = jQuery("<div />");

					//Attach the onclick function.
					blocker.click(function()
					{
						$this.modalBlock("_blocker_click");
					});

					//Save the blocker object reference.
					$this.data("modalBlockBlocker", blocker);
				}
			});
		},
		//Check to make sure instance is properly initialized.
		_init_check: function()
		{
			//Setup
			var $this = jQuery(this);
			var settings = $this.data("modalBlockSettings");
			var blocker = $this.data("modalBlockBlocker");

			//Check if not initialized.
			if(!settings || !blocker)
			{
				jQuery.error("Error retrieving settings and blocker instance. Has modalBlock() been initialized?");
				return false;
			}
		},
		//Check to make sure the specified elements meets basic requirements to be a container.
		_container_check: function()
		{
			var $this = this.get(0);
			var getDisplayType = function(element) { var cStyle = element.currentStyle || window.getComputedStyle(element, ""); return cStyle.display; }

			//Check only if set on an element, not the full window.
			if(!jQuery.isWindow($this) && $this != document && $this != document.body)
			{
				//Check if the specified container element is a block.
				if(getDisplayType($this) !== "block")
				{
					jQuery.error("Specified element cannot be used as a modal block container because it is not a block.");
					return false;
				}
			}
			
			return true;
		},
		//Check to make sure the specified block meets basic requirements and return as a jQuery object.
		_block_check: function(wrapper)
		{
			//wrapper.block is used because block is an object which was wrapped to allow pass by reference.

			if(!wrapper.block)
			{
				jQuery.error("Block was not specified during jQuery.modalBlock(\"show\")");
			}
			else if(typeof wrapper.block === "string")
			{
				wrapper.block = jQuery("#"+wrapper.block);

				if(wrapper.block.length !== 1)
				{
					jQuery.error("Block is not unique or missing. (length != 1)");
				}
			}
			else if(wrapper.block.nodeType)
			{
				wrapper.block = jQuery(wrapper.block);
			}
			else if(wrapper.block.jquery && wrapper.block.length === 1)
			{
				//This is the expected return type.
			}
			else
			{
				jQuery.error("Unknown type passed to modalBlock(\"show\").");
			}
		},
		//Show the specified block as a modal.
		show: function(block)
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");

				//Check to verify object is properly initialized.
				$this.modalBlock("_init_check");

				//Final check to make sure the specified container is actually a block.
				$this.modalBlock("_container_check");

				//Check to make sure block is valid, and format accordingly.
				var wrapper = {block: block}; //Wrap block in object to pass by reference.
				$this.modalBlock("_block_check", wrapper);
				block = wrapper.block; //Pull block out of the wrapper object.

				//If a block is currently in view, hide it.
				if(settings.isShowing)
				{
					settings.block_current.hide();
				}

				//Set the isShowing flag to true.
				settings.isShowing = true;

				//Update the block_stack.
				settings.block_stack.push(block);
				
				//Set block_current to the current block.
				settings.block_current = block;

				//If a delay is set, call show method with delay.
				if(settings.show_delay > 0)
				{
					setTimeout(function()
					{
						$this.modalBlock("_showReal", block, true);
					},
					settings.show_delay);
				}
				else
				{
					$this.modalBlock("_showReal", block, true);
				}
			});
		},
		//Internal function to handle additional parts of the show() method.
		_showReal: function(block, isShow)
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");
				var blocker = $this.data("modalBlockBlocker");

				//Only setup the blocker if this is the first block in the stack. Otherwise we are just reusing.
				if(!settings.blocker_showing)
				{
					//Setup various last minute settings on the blocker.
					$this.modalBlock("_blocker_setup");
				}

				//Execute the hook if defined.
				if(settings.hook_show_before)
				{
					settings.hook_show_before();
				}

				//Set the container.
				if(jQuery.isWindow(this) || this === document || this === document.body)
				{
					var container = jQuery("body");
				}
				else
				{
					var container = $this;
				}

				//Attach blocker and block to container.
				if(!settings.blocker_showing)
				{
					container.append(blocker);
					blocker.show();
					settings.blocker_showing = true;
				}
				container.append(block);

				//Call the resize/reposition method.
				$this.modalBlock("reposition");

				//Display after the reposition so that the calculations don't get distorted.
				block.show();

				//Execute the hook if defined.
				if(settings.hook_show_after)
				{
					settings.hook_show_after();
				}
			});
		},
		//Hide the currently displaying modal.
		hide: function()
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");
				var blocker = $this.data("modalBlockBlocker");
				
				//Check to verify object is properly initialized.
				$this.modalBlock("_init_check");

				//Verify block is actually showing before proceeding.
				if(!settings.isShowing)
				{
					jQuery.error("Hide called when modalBlock is not visible.");
				}

				//Pull the currently displaying block from the settings.
				var block = settings.block_current;

				//Execute the hook if defined.
				if(settings.hook_hide_before)
				{
					settings.hook_hide_before();
				}

				//Hide the block, then attach to body.
				block.hide();
				jQuery("body").append(block.detach());

				//Update the block stack.
				settings.block_stack.pop();
				
				//If this is the last block.
				if(settings.block_stack.length === 0)
				{
					//Hide the blocker.
					blocker.hide();
					jQuery("body").append(blocker.detach());

					//Update the current settings.
					settings.isShowing = false;
					settings.blocker_showing = false;
					settings.block_current = null;
				}
				//This is not the last block.
				else
				{
					block = settings.block_stack[settings.block_stack.length-1];
					settings.block_current = block;
					$this.modalBlock("_showReal", block, false);
				}

				//Execute the hook if defined.
				if(settings.hook_hide_after)
				{
					settings.hook_hide_after();
				}
			});
		},
		//Return the specified setting, or set specified setting.
		settings: function(setting, newValue)
		{
			//Setup
			var $this = jQuery(this);
			var settings = $this.data("modalBlockSettings");

			//Check to verify object is properly initialized.
			$this.modalBlock("_init_check");

			//Check for an incorrect query.
			if(settings[setting] === undefined)
			{
				jQuery.error("The setting \""+setting+"\" was not found.");
			}

			//Check if this is a get or set.
			if(newValue === undefined)
			{
				return settings[setting];
			}
			else
			{
				settings[setting] = newValue;
				$this.data("modalBlockSettings", settings);
				return true;
			}
		},
		//Setup various settings on the blocker immediately before display.
		_blocker_setup: function()
		{
			return this.each(function()
			{
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");
				var blocker = $this.data("modalBlockBlocker");

				//Check to verify object is properly initialized.
				$this.modalBlock("_init_check");

				//Set basic object attributes.
				blocker.css("background", settings.blocker_background);

				//Blocker opacity.
				blocker.css("opacity", settings.blocker_opacity / 100);
				blocker.css("filter", "alpha(opacity=" + settings.blocker_opacity + ")");

				//Set the z-index a static value if it was defined >= 0; It is "auto" otherwise.
				if(settings.blocker_zindex >= 0)
				{
					blocker.css("zIndex", settings.blocker_zindex);
				}

				//Hide blocker to ensure it doesn't pop up unexpectedly.
				blocker.hide();
			});
		},
		//Alias for repostion.
		resize: function() { this.modalBlock("reposition"); },
		reposition: function()
		{
			//Setup
			var $this = this;
			var settings = $this.data("modalBlockSettings");
			var blocker = $this.data("modalBlockBlocker");

			//Check to verify object is properly initialized.
			$this.modalBlock("_init_check");
	
			//Verify block is actually showing before proceeding.
			if(!settings.isShowing)
			{
				jQuery.error("Reposition called when modalBlock is not visible.");
			}

			//If a delay is set, call reposition method with delay.
			if(settings.reposition_delay > 0)
			{
				setTimeout(function()
				{
					$this.modalBlock("_repositionReal");
				},
				settings.reposition_delay);
			}
			else
			{
				$this.modalBlock("_repositionReal");
			}			
		},
		//Resize, reposition, and adjust zIndex if required.
		_repositionReal: function()
		{
			//Setup
			var $this = this;
			var settings = $this.data("modalBlockSettings");
			var blocker = $this.data("modalBlockBlocker");

			//Pull the currently displaying block from the settings.
			var block = settings.block_current;
			
			//Attach the blocker, and set width, height, top, left.
			if(jQuery.isWindow(this.get(0)) || this.get(0) === document || this.get(0) === document.body)
			{
				var container = jQuery("body");
				blocker.css("position", "fixed");
				blocker.css("width", $this.width()+"px");
				blocker.css("height", $this.height()+"px");
				blocker.css("left", "0px");
				blocker.css("top", "0px");

				//Reposition the block if the window changes size.
				$this.resize(function()
				{
					//Only continue if showing.
					if(settings.isShowing)
					{
						$this.modalBlock("reposition");
					}
				});
			}
			else
			{
				//jQuery will sometimes miscalculate the container height.
				//There is currently no known fix for this other than a static defined height on the container.

				var container = $this;
				blocker.css("position", "absolute");
				blocker.css("width", $this.outerWidth()+"px");
				blocker.css("height", $this.outerHeight()+"px");
				blocker.css("left", "0px");
				blocker.css("top", "0px");
			}

			//Center the block on top of the container.
			//Use the blocker for position since the container dimensions are calculated depending on type.
			block.css("position", "absolute");
			var block_left = (blocker.width() - block.width() > 0) ? Math.round((blocker.width() - block.width())/settings.reposition_x_denominator) : 0;
			var block_top = (blocker.height() - block.height() > 0) ? Math.round((blocker.height() - block.height())/settings.reposition_y_denominator) : 0;
			//If this is a window, add the scroll offset.
			if(jQuery.isWindow(this.get(0)) || this.get(0) === document || this.get(0) === document.body)
			{
				block_top += jQuery(window).scrollTop();
			}
			block.css("left", block_left+"px");
			block.css("top", block_top+"px");

			//Dynamically set zIndex if <= 0.
			//The z-index is set after positioning to fix a glitch with Webkit thinking the z-index was 0.
			if(settings.blocker_zindex <= 0)
			{
				blocker.css("zIndex", function()
				{
					var max = 0;
					jQuery("*").each(function()
					{
						var z =	jQuery(this).css("zIndex");
						if(z !== "auto" && z > max)
						{
							max = z;
						}
					});
					
					return parseInt(max) + 1;
				});
			}
			//Block should always appear above blocker.
			block.css("zIndex", parseInt(blocker.css("zIndex"))+10);
		},
		//Method called when the blocker is clicked.
		_blocker_click: function()
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");

				if(settings.blocker_close_on_click)
				{
					jQuery(settings.owner).modalBlock("hide");
				}
			});
		},
		//Returns true or false on if a modal block is currently showing.
		isShowing: function()
		{
			var settings = this.data("modalBlockSettings");

			return settings.isShowing;
		},
		//Remove modalBlock from the object, effectively returning it to its uninitialized state.
		remove: function()
		{
			return this.each(function()
			{
				//Setup
				var $this = jQuery(this);
				var settings = $this.data("modalBlockSettings");
				var blocker = $this.data("modalBlockBlocker");

				//Check to verify object is properly initialized.
				$this.modalBlock("_init_check");

				//If showing, hide until not showing anymore.
				while(settings.isShowing)
				{
					$this.modalBlock("hide");
				}

				//Detach blocker
				blocker.detach();
				
				//Remove all data associated with modalBlock.
				$this.removeData("modalBlockSettings");
				$this.removeData("modalBlockBlocker");
			});
		}
	}

	//Define namespace and method functionality.
	jQuery.fn.modalBlock = function(method)
	{
		//Call appropriate method. (Standard jQuery recommended pattern.)
		if(methods[method])
		{
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if(typeof method === 'object' || !method)
		{
			return methods.init.apply(this, arguments);
		}
		else
		{
			jQuery.error('Method '+ method+' does not exist on jQuery.modalBlock.');
		}    
	}
})(jQuery);
