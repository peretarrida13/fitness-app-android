package com.peretarrida.fittracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.peretarrida.fittracker.plugins.whoop.WhoopPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WhoopPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
