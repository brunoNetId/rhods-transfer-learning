/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.example;

import org.apache.camel.builder.RouteBuilder;

import org.apache.camel.BindToRegistry;
import org.apache.camel.CamelContext;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;

public class Routes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        // Routes are loaded from XML files
        // It alligns a definition standard with Fuse and Camel K
    }

    //Controller declaration
    public static class Controller {};

    @BindToRegistry
    public static Controller controller(){

        //Controller implementation
        return new Controller(){

            // Helper variables
            // boolean expiredTimeWindow = false;
            // CountDownLatch latch      = null;
            int pending      = 0;
            int total        = 0;
            // long lastMessageTime      = 0;
            CamelContext context = null;

            //Needs revision:
            //This implementation is currently missing to persist the edgeID
            //In case of reboot the edgeId information is lost
            String edgeId = null;

            public synchronized void init(int pending, CamelContext context) {

            	System.out.println("INIT CONTROLLER");

            	this.pending = pending;
            	this.context = context;
            }

            public void test() {

            	System.out.println("TEST CONTROLLER, pending: "+pending);
            }

            public boolean isBusy(String id) {

                boolean isBusy = pending > 0;

                if(!isBusy)
                    edgeId = id;

            	// System.out.println("TEST CONTROLLER, pending: "+pending);
                // return pending > 0;
            	return isBusy;
            }

            // public void setEdgeId(String id) {

            //     edgeId = id;
            // }

            public String getEdgeId() {

                return edgeId;
            }

            public void jobPending() {
            	pending++;
            	// System.out.println("PENDING CONTROLLER, pending: "+pending);
            }

            public void jobDone() {

            	pending--;
            	total++;
            	// System.out.println("DONE CONTROLLER, pending: "+pending);

            	if(pending < 1){
                    context.createProducerTemplate().asyncSendBody("direct:trigger-pipeline", null);
            		System.out.println("TOTAL CONTROLLER, total: "+total);
            		total=0;
            	}
            }
        };
    }

}
