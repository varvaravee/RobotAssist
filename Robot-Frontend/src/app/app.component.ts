import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';
import * as ROSLIB from 'roslib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  private ros!: ROSLIB.Ros;
  private leftJoystickPublisher!: ROSLIB.Topic;
  private rightJoystickPublisher!: ROSLIB.Topic;
  private joint1JoystickPublisher!: ROSLIB.Topic;
  private joint2JoystickPublisher!: ROSLIB.Topic;

  // Set the video URL to the Raspberry Pi stream
  videoUrl: string = 'http://192.168.1.29:8080/?action=stream';

  ngOnInit() {
    this.initRosConnection();
    this.initJoystick();
  }

  ngAfterViewInit() {
    this.startCameraFeed();
  }

  startCameraFeed() {
    console.log('Streaming camera from:', this.videoUrl);
  }

  initRosConnection() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.1.29:9090' // Replace with actual IP
    });

    this.ros.on('connection', () => {
      console.log('Connected to ROS 2 via rosbridge');
    });

    this.ros.on('error', (error: any) => { 
      console.error('WebSocket Error:', error);
    });
    

    this.ros.on('close', () => {
      console.log('Connection to rosbridge closed.');
    });

    // Define publishers for joystick topics
    this.leftJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/motor_commands',
      messageType: 'std_msgs/Int16MultiArray'
    });

    this.rightJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/steering_angle',
      messageType: 'std_msgs/Float32'
    });

    this.joint1JoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/arm_joint_1_angle',
      messageType: 'std_msgs/Float32'
    });

    this.joint2JoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/arm_joint_2_angle',
      messageType: 'std_msgs/Float32'
    });
  }

  sendJoystickCommand(publisher: ROSLIB.Topic, data: number | number[]) {
    console.log(`Publishing to ${publisher.name}:`, data);
  
    let message;
    
    if (Array.isArray(data)) {
      // If data is an array, send it as Int16MultiArray
      message = new ROSLIB.Message({
        data: data
      });
    } else {
      // If data is a single number, send it as Float32
      message = new ROSLIB.Message({
        data: parseFloat(data.toFixed(2)) // Ensure it's a float
      });
    }  
    publisher.publish(message);
  }
  


  initJoystick() {
    const joystickElement = document.getElementById('joystick-combined');
    const joint1JoystickElement = document.getElementById('joystick-joint1');
    const joint2JoystickElement = document.getElementById('joystick-joint2');

    if (joystickElement) {
      const joystick = nipplejs.create({
        zone: joystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
        size: 100,
      
      });

      joystick.on('move', (event, data) => {
        if (!data.vector) return; // Ignore if no movement detected

          const x = data.vector.x; //x-axis 
          const y = data.vector.y; //y-axis , stinky buttheos
    
          
          // Map y to speed range (-100 to -20 for reverse, 20 to 100 for forward)
          const magnitude = Math.sqrt(x * x + y * y); // Joystick distance from center (0 to 1)
          const direction = y >= 0 ? 1 : -1; // Forward (1) or backward (-1)
          
          // Map magnitude to speed range (20 to 100 for forward, -20 to -100 for reverse)
          let speed = Math.round(direction * (20 + magnitude * 80));

          // Calculate direction (angle in degrees)
          let angle = Math.atan2(y, x) * (180 / Math.PI); // -180 to 180
          // Convert angle so backward movement is also within 0-180 range
          if (angle < 0) {
            angle = Math.abs(angle); // Flip negative angles to positive
          }
          angle = Math.round(angle); //round angle

          //console output for troubleshooting
          console.log(`Joystick Moved Speed: ${speed}, Angle: ${angle}`);

          //send commands to trigger ros topics through rosbridge
          this.sendJoystickCommand(this.leftJoystickPublisher, [speed, speed]);
          this.sendJoystickCommand(this.rightJoystickPublisher, angle);


      });

      joystick.on('end', () => {
        this.sendJoystickCommand(this.leftJoystickPublisher, [0,0]);
        this.sendJoystickCommand(this.rightJoystickPublisher, 90);
      });
    }

    // if (rightJoystickElement) {
    //   const rightJoystick = nipplejs.create({
    //     zone: rightJoystickElement,
    //     mode: 'static',
    //     position: { left: '50%', top: '50%' },
    //     color: 'red',
    //     size: 100,
    //     lockX: true // Right joystick moves only left/right
    //   });

    //   rightJoystick.on('move', (event, data) => {
    //     if (!data.vector) return; // Ignore if no movement detected

    //       const x = data.vector.x; // Get horizontal movement (-1 to 1)
    //       const degrees = Math.round((1 - x) * 90); // Map from 0° (right) to 180° (left)

    //       console.log(`Joystick Right Angle: ${degrees}°`);

    //       this.sendJoystickCommand(this.rightJoystickPublisher, degrees);
    //   });

    //   rightJoystick.on('end', () => {
    //     this.sendJoystickCommand(this.rightJoystickPublisher, 90);
    //   });
    // }

    if (joint1JoystickElement) {
      const joint1Joystick = nipplejs.create({
        zone: joint1JoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'green',
        size: 100,
        lockY: true // Right joystick moves only up/down
      });

      joint1Joystick.on('move', (event, data) => {
        if (!data.vector) return; // Ignore if no movement detected

        const y = data.vector.y; // Get horizontal movement (-1 to 1)
        const degrees = Math.round((1 - y) * 90); // Map from 0° (up) to 180° (down)

        console.log(`Joystick Joint1 Angle: ${degrees}°`);

          this.sendJoystickCommand(this.joint1JoystickPublisher, degrees);
      });

      joint1Joystick.on('end', () => {
        this.sendJoystickCommand(this.joint1JoystickPublisher, 90);
      });
    }

    if (joint2JoystickElement) {
      const joint2Joystick = nipplejs.create({
        zone: joint2JoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'purple',
        size: 100,
        lockY: true // Right joystick moves only up/down
      });

      joint2Joystick.on('move', (event, data) => {
        if (!data.vector) return; // Ignore if no movement detected

        const y = data.vector.y; // Get horizontal movement (-1 to 1)
        const degrees = Math.round((1 - y) * 90); // Map from 0° (up) to 180° (down)

        console.log(`Joystick Joint2 Angle: ${degrees}°`);

          this.sendJoystickCommand(this.joint2JoystickPublisher, degrees);
      });

      joint2Joystick.on('end', () => {
        this.sendJoystickCommand(this.joint2JoystickPublisher, 90);
      });
    }
  }
}
