'use strict';

const BleBoxDevice = require('../../lib/bleboxdevice.js');

class wLightBoxSDevice extends BleBoxDevice {

  async onBleBoxInit()
  {
    // Backward compatibility - add "effect_selector" capability if not exists
    if (!this.hasCapability('effect_selector')) 
      this.addCapability('effect_selector');


    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
		this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerCapabilityListener('effect_selector', this.onCapabilityEffectSelector.bind(this));

  }

  async pollBleBox() 
	{
    // Read the device state
    await this.bbApi.wLightBoxGetState(this.getSetting('address'), this.getSetting('apiLevel'))
    .then(result => {
      const brightness = Math.round(parseInt(result.rgbw.desiredColor,16)/255*100)/100;
      const onState = brightness > 0 ? true : false;
      if(brightness>0)
      {
        this.previousDimLevel = brightness;
      }
      if (brightness != this.getCapabilityValue('dim')) {
        this.setCapabilityValue('dim', brightness)
          .catch( err => {
            this.log(err);
          })
      }

      if (onState != this.getCapabilityValue('onoff')) {
        this.setCapabilityValue('onoff', onState)
          .catch( err => {
            this.log(err);
          })
      }

      if (result.rgbw.effectID.toString() != this.getCapabilityValue('effect_selector')) {
        this.setCapabilityValue('effect_selector', result.rgbw.effectID.toString())
          .catch( err => {
            this.log(err);
          })
      }


    })
    .catch(error => {
      this.log(error);
    })
	}

  /**
     * Send the state to the device
     */
  async onCapabilityOnoff( value, opts ) 
  {
    if(value==true)
    {
      const hexBrightness = this.getSetting('dimOn') != 'previous' ? Math.round(this.getSetting('dimOn')*255/100).toString(16) : 
                              Math.round(this.previousDimLevel*255).toString(16);
      // Turn on the device
      await this.bbApi.wLightBoxSetState(this.getSetting('address'),hexBrightness)
      .catch(error => {
        this.log(error);
      })
    }
    else
    {
      // Turn off the device
      await this.bbApi.wLightBoxSetState(this.getSetting('address'),'00')
      .catch(error => {
        this.log(error);
      })
    }
  }

  // this method is called when the Device has requested a state change (turned on or off)
  async onCapabilityDim( value, opts ) {

    let hexBrightness = Math.round(value*255).toString(16);
    if(value*255<16) hexBrightness = "0"+hexBrightness;
    // Dim the device
    await this.bbApi.wLightBoxSetState(this.getSetting('address'),hexBrightness)
    .catch(error => {
        // Error occured
        this.log(error);
    })
  }

  async onCapabilityEffectSelector( value, opts ) {
    // Change the effect
    await this.bbApi.wLightBoxSetEffect(this.getSetting('address'),value)
    .catch(error => {
      this.log(error);
    })
  }


}

module.exports = wLightBoxSDevice;
